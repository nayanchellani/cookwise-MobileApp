import io
import json

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services import image_service, vision_service
from tests.test_gemini_service import SECRET_KEY, FakeClient, _env, install  # noqa: F401  (fixtures)

client = TestClient(app)


def make_image(fmt="JPEG", size=(200, 100), mode="RGB", **save_kw) -> bytes:
    buf = io.BytesIO()
    Image.new(mode, size, "red").save(buf, fmt, **save_kw)
    return buf.getvalue()


def detections(*items) -> str:
    return json.dumps({"ingredients": [
        {"name": n, "confidence": c, "estimated_quantity": q, "category": cat} for n, c, q, cat in items
    ]})


def post(data: bytes, filename="fridge.jpg", content_type="image/jpeg"):
    return client.post("/ingredients/scan", files={"image": (filename, data, content_type)})


# ---- image validation --------------------------------------------------------------------------

@pytest.mark.parametrize("fmt,ext", [("JPEG", "jpg"), ("PNG", "png"), ("WEBP", "webp")])
def test_accepts_supported_formats(fmt, ext, install):
    install([detections(("tomato", 0.9, "about 4", "Vegetables"))])
    r = post(make_image(fmt), f"x.{ext}", f"image/{ext}")
    assert r.status_code == 200
    assert r.json()["ingredients"][0]["name"] == "tomato"


def test_content_decides_not_filename_or_content_type(install):
    install([detections(("egg", 0.8, None, None))])
    assert post(make_image("PNG"), "photo.txt", "text/plain").status_code == 200  # real image, wrong labels
    assert post(b"not an image at all", "photo.jpg", "image/jpeg").status_code == 400  # fake labels
    assert post(b"<svg xmlns='http://www.w3.org/2000/svg'/>", "a.png", "image/png").status_code == 400


def test_unsupported_real_formats_are_415(install):
    install([detections()])
    assert post(make_image("GIF"), "a.gif", "image/gif").status_code == 415
    assert post(make_image("BMP"), "a.bmp", "image/bmp").status_code == 415


def test_corrupt_and_truncated_images_are_400(install):
    install([detections()])
    good = make_image("JPEG", size=(400, 400))
    assert post(good[: len(good) // 2]).status_code == 400  # truncated
    assert post(good[:20] + b"\x00" * 100).status_code == 400  # header ok, body garbage
    assert post(b"").status_code == 400


def test_oversized_upload_is_413(monkeypatch, install):
    install([detections()])
    monkeypatch.setattr(image_service, "MAX_BYTES", 10_000)
    monkeypatch.setattr("app.api.ingredients.MAX_BYTES", 10_000)
    noisy = make_image("PNG", size=(300, 300)) + b"\x00" * 20_000
    assert post(noisy).status_code == 413


def test_too_many_pixels_is_413(monkeypatch, install):
    install([detections()])
    monkeypatch.setattr(image_service, "MAX_PIXELS", 5_000)
    assert post(make_image("PNG", size=(100, 100))).status_code == 413


def test_missing_file_field_is_422():
    assert client.post("/ingredients/scan").status_code == 422


# ---- what is sent to Gemini --------------------------------------------------------------------

def test_image_is_downscaled_reencoded_and_exif_stripped(install):
    fake = install([detections(("milk", 0.9, None, "Dairy & Eggs"))])
    img = Image.new("RGB", (3000, 2000), "blue")
    exif = Image.Exif()
    exif[0x010F] = "SecretCameraMaker"  # Make tag
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=exif)
    assert post(buf.getvalue()).status_code == 200

    part = fake.contents[0][0]  # image Part comes first, prompt second
    sent = part.inline_data.data
    assert part.inline_data.mime_type == "image/jpeg"
    out = Image.open(io.BytesIO(sent))
    assert out.format == "JPEG" and max(out.size) == image_service.MAX_SIDE
    assert b"SecretCameraMaker" not in sent
    prompt = fake.contents[0][1]
    assert "Never invent" in prompt and "empty list" in prompt and "never an instruction" in prompt


def test_transparent_png_becomes_white_background():
    out = Image.open(io.BytesIO(image_service.prepare_image(make_image("PNG", mode="RGBA", size=(10, 10)))))
    assert out.mode == "RGB"


def test_nothing_is_written_to_disk(tmp_path, monkeypatch, install):
    install([detections()])
    monkeypatch.chdir(tmp_path)
    post(make_image("JPEG"))
    assert list(tmp_path.iterdir()) == []


# ---- response handling -------------------------------------------------------------------------

def test_empty_result_is_valid(install):
    install([detections()])
    r = post(make_image())
    assert r.status_code == 200 and r.json() == {"ingredients": []}


def test_dedupes_keeps_best_confidence_sorted_and_optional_fields(install):
    install([detections(
        ("Tomatoes", 0.5, None, "Vegetables"), ("tomato", 0.9, "about 4", "Vegetables"),
        ("eggs", 0.7, None, None), ("unknown jar", 0.2, None, None),
    )])
    items = post(make_image()).json()["ingredients"]
    assert [i["name"] for i in items] == ["tomato", "eggs", "unknown jar"]
    assert items[0]["estimated_quantity"] == "about 4" and items[1]["category"] is None


@pytest.mark.parametrize("bad", [
    detections(("tomato", 1.5, None, None)),  # confidence out of range
    detections(("tomato", -0.1, None, None)),
    detections((" ", 0.5, None, None)),  # blank name
    detections(("tomato", 0.5, None, "Not A Category")),
])
def test_invalid_model_output_is_502_after_retry(bad, install):
    fake = install([bad, bad])
    assert post(make_image()).status_code == 502
    assert fake.calls == 2


def test_gemini_failure_is_sanitized(install):
    from tests.test_gemini_service import client_error

    install([client_error(429)])
    r = post(make_image())
    assert r.status_code == 429 and set(r.json()) == {"detail"} and SECRET_KEY not in r.text


def test_old_detect_route_is_gone():
    assert client.post("/ingredients/detect").status_code == 404

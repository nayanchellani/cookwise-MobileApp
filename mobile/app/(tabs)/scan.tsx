// Scan tab — Camera-first Food Utility with Live Animated Scanner
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Image as ImageIcon, Sparkles, RefreshCw, AlertCircle } from 'lucide-react-native';
import { Colors } from '../../src/constants/colors';
import { Spacing, Radius, FontSize, FontWeight, Typography, Shadows } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LoadingState } from '../../src/components/LoadingState';
import { scanIngredients } from '../../src/api/ingredients';
import { extractErrorMessage } from '../../src/api/client';
import { useAppStore } from '../../src/store/appStore';
import { triggerNotification } from '../../src/utils/haptics';

type Status = 'idle' | 'scanning' | 'error';

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { dispatch } = useAppStore();

  // Animated laser line & corner pulsation
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (status === 'scanning') {
      scanLineAnim.setValue(0);
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      scanLineAnim.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [status]);

  async function requestAndPick(source: 'camera' | 'gallery') {
    if (source === 'camera') {
      const { status: s } = await ImagePicker.requestCameraPermissionsAsync();
      if (s !== 'granted') {
        Alert.alert('Camera Access Required', 'Please enable camera permissions to photograph ingredients.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.65,
        allowsEditing: false,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } else {
      const { status: s } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (s !== 'granted') {
        Alert.alert('Gallery Access Required', 'Please enable photo library access to select an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.65,
        allowsEditing: false,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    }
  }

  async function handleScan() {
    if (!imageUri || status === 'scanning') return;
    setStatus('scanning');
    setErrorMsg('');
    try {
      const result = await scanIngredients(imageUri);
      triggerNotification();
      dispatch({ type: 'SET_SCAN', imageUri, ingredients: result.ingredients });
      router.push('/scan/confirm');
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ingredient Vision</Text>
          <Text style={styles.subtitle}>
            Capture a clear photo of your refrigerator or kitchen counter
          </Text>
        </View>

        {/* Camera Viewfinder / Preview with Animated Scanning Beam */}
        <View style={styles.viewfinder}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

              {/* Animated Laser Scanning Beam */}
              {status === 'scanning' && (
                <Animated.View
                  style={[
                    styles.scanLaserBeam,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 275],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.scanLaserLine} />
                  <View style={styles.scanLaserGlow} />
                </Animated.View>
              )}
            </>
          ) : (
            <View style={styles.viewfinderEmpty}>
              <View style={styles.cameraIconCircle}>
                <Camera size={32} color={Colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No photo captured</Text>
              <Text style={styles.emptySub}>
                Position produce, vegetables, or proteins in good natural light
              </Text>
            </View>
          )}

          {/* Viewfinder corner brackets */}
          <View style={[styles.corner, styles.cornerTL, status === 'scanning' && styles.cornerActive]} />
          <View style={[styles.corner, styles.cornerTR, status === 'scanning' && styles.cornerActive]} />
          <View style={[styles.corner, styles.cornerBL, status === 'scanning' && styles.cornerActive]} />
          <View style={[styles.corner, styles.cornerBR, status === 'scanning' && styles.cornerActive]} />

          {status === 'scanning' && (
            <View style={styles.scanningPill}>
              <Sparkles size={12} color={Colors.accent} />
              <Text style={styles.scanningPillText}>ANALYZING INGREDIENTS…</Text>
            </View>
          )}
        </View>

        {/* Error message */}
        {status === 'error' && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Trigger Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.utilityAction}
            onPress={() => requestAndPick('camera')}
            activeOpacity={0.85}
            disabled={status === 'scanning'}
          >
            <Camera size={20} color={Colors.primary} />
            <Text style={styles.utilityActionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilityAction}
            onPress={() => requestAndPick('gallery')}
            activeOpacity={0.85}
            disabled={status === 'scanning'}
          >
            <ImageIcon size={20} color={Colors.primary} />
            <Text style={styles.utilityActionText}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <View style={styles.actionsGroup}>
            <PrimaryButton
              title={status === 'scanning' ? 'Identifying Ingredients…' : 'Identify Ingredients'}
              icon={<Sparkles size={16} color={Colors.backgroundWhite} />}
              onPress={handleScan}
              loading={status === 'scanning'}
              size="lg"
            />
            <TouchableOpacity
              style={styles.retakeRow}
              onPress={() => setImageUri(null)}
              activeOpacity={0.8}
              disabled={status === 'scanning'}
            >
              <RefreshCw size={14} color={Colors.textSecondary} />
              <Text style={styles.retakeText}>Discard & select another</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },

  header: {
    gap: 2,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },

  viewfinder: {
    height: 300,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.subtle,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  viewfinderEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  cameraIconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: FontSize.xs * 1.5,
  },

  // Laser beam
  scanLaserBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
    zIndex: 5,
  },
  scanLaserLine: {
    height: 2,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  scanLaserGlow: {
    height: 18,
    backgroundColor: 'rgba(233, 164, 91, 0.12)',
  },

  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: Colors.primary,
    zIndex: 6,
  },
  cornerActive: {
    borderColor: Colors.accent,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },

  scanningPill: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(32, 40, 32, 0.88)',
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    zIndex: 10,
  },
  scanningPillText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.backgroundWhite,
    letterSpacing: 0.8,
  },

  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  utilityAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    ...Shadows.subtle,
  },
  utilityActionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },

  actionsGroup: {
    gap: Spacing.sm,
  },
  retakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  retakeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(201, 75, 75, 0.08)',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.error,
  },
});

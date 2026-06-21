package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import java.io.File

class MainActivity : ComponentActivity(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var gyroscopeSensor: Sensor? = null
    
    @Volatile
    private var gyroPitchSum = 0f
    @Volatile
    private var gyroYawSum = 0f
    
    private var isGyroEnabled = false
    private var gyroSensitivity = 1.0f

    // Gyroscope calibration/drift parameters
    private var gyroPitchBias = 0f
    private var gyroYawBias = 0f
    private var calibrationSamples = 0
    @Volatile
    private var isCalibrating = false
    private var calibrationPitchSum = 0f
    private var calibrationYawSum = 0f

    private var vibrator: Vibrator? = null
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize sensors
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        gyroscopeSensor = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        
        // Initialize vibrator safely across compatible versions
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        
        requestGameAudioFocus()
        
        // Direct, high-performance native WebView initialization 
        val webViewInstance = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            
            WebView.setWebContentsDebuggingEnabled(true)
            
            @SuppressLint("SetJavaScriptEnabled")
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowFileAccessFromFileURLs = true
            settings.allowUniversalAccessFromFileURLs = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.databaseEnabled = true
            settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            settings.setSupportMultipleWindows(false)
            settings.javaScriptCanOpenWindowsAutomatically = false
            
            // Critical full-viewport consistency settings for tactile action/3D games
            settings.textZoom = 100
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            
            settings.allowContentAccess = true
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            webViewClient = WebViewClient()
            
            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                    Log.d("WebViewJS", "${consoleMessage.message()} -- From line ${consoleMessage.lineNumber()} of ${consoleMessage.sourceId()}")
                    return true
                }
            }
            
            // Optimizations for modern 90Hz/120Hz Snapdragon devices (like Xiaomi MIX 4)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                try {
                    requestUnbufferedDispatch(android.view.InputDevice.SOURCE_TOUCHSCREEN)
                    Log.d("SystemOptimization", "Enabled unbuffered touchscreen input dispatching for lowest control latency")
                } catch (e: Exception) {
                    Log.e("SystemOptimization", "unbuffered dispatch error: ${e.message}")
                }
            }
            
            addJavascriptInterface(WebAppInterface(), "Android")
            loadUrl("file:///android_asset/index.html")
        }
        
        this.webView = webViewInstance
        
        // Dynamic Refresh Rate Optimization for modern displays (such as 120Hz panel on Mi Mix 4 running Android 14)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                display?.supportedModes?.maxByOrNull { it.refreshRate }?.let { bestMode ->
                    val lp = window.attributes
                    lp.preferredDisplayModeId = bestMode.modeId
                    window.attributes = lp
                    Log.d("SystemOptimization", "Configured High Refresh Rate Display Mode: ${bestMode.refreshRate} Hz")
                }
            } catch (e: Exception) {
                Log.e("SystemOptimization", "Display refresh rate optimization failed: ${e.message}")
            }
        }
        
        // Embed the WebView inside a solid black full-screen FrameLayout container
        val rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(android.graphics.Color.BLACK)
            addView(webViewInstance)
        }
        
        setContentView(rootLayout)
        
        hideSystemUI()
    }

    override fun onResume() {
        super.onResume()
        requestGameAudioFocus()
        if (isGyroEnabled) {
            registerGyroscope()
        }
        webView?.onResume()
        webView?.resumeTimers()
    }

    override fun onPause() {
        super.onPause()
        unregisterGyroscope()
        webView?.onPause()
        webView?.pauseTimers()
    }

    private fun requestGameAudioFocus() {
        try {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_GAME)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setOnAudioFocusChangeListener { /* handle state changes if useful */ }
                    .build()
                audioManager.requestAudioFocus(focusRequest)
            } else {
                @Suppress("DEPRECATION")
                audioManager.requestAudioFocus(
                    { /* change listener */ },
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN
                )
            }
            Log.d("SystemOptimization", "Requested game audio focus to satisfy AppOps CONTROL_AUDIO check")
        } catch (e: Exception) {
            Log.e("SystemOptimization", "Failed to request audio focus: ${e.message}")
        }
    }

    private fun registerGyroscope() {
        gyroscopeSensor?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
    }

    private fun unregisterGyroscope() {
        sensorManager.unregisterListener(this)
    }

    private fun hideSystemUI() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
        windowInsetsController.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        windowInsetsController.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    // SensorEventListener methods
    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_GYROSCOPE) {
            val rawPitch = event.values[0]
            val rawYaw = event.values[1]

            synchronized(this) {
                if (isCalibrating) {
                    calibrationPitchSum += rawPitch
                    calibrationYawSum += rawYaw
                    calibrationSamples++
                    if (calibrationSamples >= 60) { // ~1 second of samples at SENSOR_DELAY_GAME
                        gyroPitchBias = calibrationPitchSum / calibrationSamples
                        gyroYawBias = calibrationYawSum / calibrationSamples
                        isCalibrating = false
                        calibrationSamples = 0
                    }
                    return
                }

                // Apply dynamic drift calibration (subtract the baseline rest noise)
                val calibratedPitch = rawPitch - gyroPitchBias
                val calibratedYaw = rawYaw - gyroYawBias

                // Apply a tiny threshold deadzone to completely stop micro-drift when holding / resting still
                val gyroDeadzone = 0.006f
                val filteredPitch = if (Math.abs(calibratedPitch) > gyroDeadzone) calibratedPitch else 0f
                val filteredYaw = if (Math.abs(calibratedYaw) > gyroDeadzone) calibratedYaw else 0f

                gyroPitchSum += filteredPitch * gyroSensitivity
                gyroYawSum += filteredYaw * gyroSensitivity
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No implementation needed
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun exitApp() {
            finish()
        }

        @JavascriptInterface
        fun setGyroscopeEnabled(enabled: Boolean) {
            isGyroEnabled = enabled
            runOnUiThread {
                if (enabled) {
                    registerGyroscope()
                } else {
                    unregisterGyroscope()
                    synchronized(this@MainActivity) {
                        gyroPitchSum = 0f
                        gyroYawSum = 0f
                    }
                }
            }
        }

        @JavascriptInterface
        fun setGyroscopeSensitivity(sens: Float) {
            gyroSensitivity = sens
        }

        @JavascriptInterface
        fun hasGyroscope(): Boolean {
            return gyroscopeSensor != null
        }

        @JavascriptInterface
        fun calibrateGyro() {
            synchronized(this@MainActivity) {
                calibrationPitchSum = 0f
                calibrationYawSum = 0f
                calibrationSamples = 0
                isCalibrating = true
            }
        }

        @JavascriptInterface
        fun pollGyro(): String {
            var pitch = 0f
            var yaw = 0f
            synchronized(this@MainActivity) {
                pitch = gyroPitchSum
                yaw = gyroYawSum
                gyroPitchSum = 0f
                gyroYawSum = 0f
            }
            return "$pitch,$yaw"
        }

        @JavascriptInterface
        fun vibrate(type: String) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && vibrator?.hasVibrator() == true) {
                try {
                    val effectId = when (type) {
                        "light" -> VibrationEffect.EFFECT_TICK
                        "medium" -> VibrationEffect.EFFECT_CLICK
                        "heavy" -> VibrationEffect.EFFECT_HEAVY_CLICK
                        else -> VibrationEffect.EFFECT_CLICK
                    }
                    vibrator?.vibrate(VibrationEffect.createPredefined(effectId))
                    return
                } catch (e: Exception) {
                    Log.e("SystemOptimization", "Predefined vibration effect failed: ${e.message}")
                }
            }
            
            // Legacy fall-back
            val ms = when (type) {
                "light" -> 15L
                "medium" -> 45L
                "heavy" -> 120L
                else -> 30L
            }
            val amplitude = when (type) {
                "light" -> 80
                "medium" -> 180
                "heavy" -> 255
                else -> 128
            }
            triggerVibration(ms, amplitude)
        }

        @JavascriptInterface
        fun vibrateCustom(ms: Long, amplitude: Int) {
            val clampedAmp = amplitude.coerceIn(1, 255)
            triggerVibration(ms, clampedAmp)
        }
    }

    private fun triggerVibration(milliseconds: Long, amplitude: Int) {
        try {
            vibrator?.let {
                if (it.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        it.vibrate(VibrationEffect.createOneShot(milliseconds, amplitude))
                    } else {
                        @Suppress("DEPRECATION")
                        it.vibrate(milliseconds)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}



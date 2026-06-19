import java.util.Base64
import java.io.File

tasks.register("diagnose") {
    doLast {
        val rootDir = project.rootDir.parentFile
        val apkFile = File(rootDir, "app/build/outputs/apk/debug/app-debug.apk")
        if (apkFile.exists()) {
            val zf = java.util.zip.ZipFile(apkFile)
            val entries = zf.entries()
            while (entries.hasMoreElements()) {
                val entry = entries.nextElement()
                if (entry.size > 2 * 1024 * 1024) {
                    println("Large file in APK: ${entry.name} - ${entry.size / (1024 * 1024.0)} MB")
                }
            }
            zf.close()
        }
    }
}

tasks.register("cleanGarbage") {
    doLast {
        val rootDir = project.rootDir.parentFile
        val assetsDir = File(rootDir, "app/src/main/assets")
        if (assetsDir.exists() && assetsDir.isDirectory) {
            assetsDir.listFiles()?.forEach { file ->
                if (file.name.startsWith("shadow_chunk_") || 
                    file.name == "shadow_protocol_debug.png" || 
                    file.name == "download_apk.html") {
                    val deleted = file.delete()
                    println("Deleted from assets: ${file.name} ($deleted)")
                }
            }
        }
        
        // Also delete from root
        rootDir.listFiles()?.forEach { file ->
            if (file.name.startsWith("shadow_protocol_debug") || 
                file.name == "download_apk.html" || 
                file.name == "shadow-protocol.apk" || 
                file.name == "shadow-protocol-build.zip") {
                val deleted = file.delete()
                println("Deleted from root: ${file.name} ($deleted)")
            }
        }
    }
}

tasks.register("generatePackagedApk") {
    doLast {
        val rootDir = project.rootDir.parentFile
        val buildDir = File(rootDir, "app/build/outputs/apk/debug")
        println("=== Build Directory Files ===")
        if (buildDir.exists() && buildDir.isDirectory) {
            buildDir.listFiles()?.forEach { file ->
                println("${file.name}: ${file.length()} bytes (~${file.length() / (1024 * 1024.0)} MB)")
            }
        } else {
            println("Build directory does not exist or is not a directory: ${buildDir.absolutePath}")
        }

        val apkFile = File(rootDir, "app/build/outputs/apk/debug/app-debug.apk")
        if (!apkFile.exists()) {
            println("ERROR: app-debug.apk not found at " + apkFile.absolutePath)
            return@doLast
        }
        
        val bytes = apkFile.readBytes()
        val totalSize = bytes.size
        println("SUCCESS: Read APK file. Size: $totalSize bytes (~${totalSize / (1024 * 1024.0)} MB)")

        // Method 1: Save as single renamed .png asset at project root
        val rootMaskPng = File(rootDir, "shadow_protocol_debug.png")
        rootMaskPng.writeBytes(bytes)
        println("SUCCESS: Created masked PNG asset at root ${rootMaskPng.absolutePath} (${rootMaskPng.length()} bytes)")
    }
}


import PopupMenu, { MenuRef } from '@components/views/PopupMenu'
import { Model } from '@lib/engine/Local/Model'
import { useState } from 'react'
import { View } from 'react-native'
import * as FileSystem from 'expo-file-system'
import { Logger } from '@lib/state/Logger'
import { AppDirectory } from '@lib/utils/File'

type ModelNewMenuProps = {
    modelImporting: boolean
    setModelImporting: (b: boolean) => void
}

const ModelNewMenu: React.FC<ModelNewMenuProps> = ({ modelImporting, setModelImporting }) => {
    const [showDownload, setShowDownload] = useState(false)

    // const handleDownloadModel = (text: string) => {}

    const handleSetExternal = async (menuRef: MenuRef) => {
        menuRef.current?.close()
        if (modelImporting) return
        setModelImporting(true)
        await Model.linkModelExternal()
        setModelImporting(false)
    }

    const handleImportModel = async (menuRef: MenuRef) => {
        menuRef.current?.close()
        if (modelImporting) return
        setModelImporting(true)

        const modelUrl = "https://huggingface.co/devil-egox/open-tutor-ia-gemma3-270M-Q8_0-GGUF/resolve/main/open-tutor-ia-gemma3-270M-Q8_0-GGUF";
        const fileName = "open-tutor-ia-gemma3-270M-Q8_0-GGUF";
        const tempLocalUri = `${FileSystem.documentDirectory}${fileName}`;
        const destLocalUri = `${AppDirectory.ModelPath}${fileName}`;

        try {
            Logger.infoToast(`Iniciando descarga de ${fileName}...`);
            console.log(`URL de descarga: ${modelUrl}`);
            console.log(`Ubicación temporal: ${tempLocalUri}`);
            console.log(`Ubicación final: ${destLocalUri}`);

            // 1. Verificar permisos y que el directorio de modelos existe
            Logger.infoToast(`Verificando permisos y directorios...`);
            
            // Verificar permisos del directorio de documentos (temporal)
            try {
                const testTempFile = `${FileSystem.documentDirectory}test_permissions.txt`;
                await FileSystem.writeAsStringAsync(testTempFile, 'test', { encoding: 'utf8' });
                await FileSystem.deleteAsync(testTempFile);
                console.log(`✅ Permisos de escritura en documentDirectory: OK`);
            } catch (permError) {
                throw new Error(`❌ Sin permisos de escritura en documentDirectory: ${permError.message}`);
            }
            
            const modelDirInfo = await FileSystem.getInfoAsync(AppDirectory.ModelPath);
            if (!modelDirInfo.exists) {
                Logger.infoToast(`Creando directorio de modelos...`);
                try {
                    await FileSystem.makeDirectoryAsync(AppDirectory.ModelPath, { intermediates: true });
                    console.log(`✅ Directorio creado: ${AppDirectory.ModelPath}`);
                } catch (dirError) {
                    throw new Error(`❌ No se pudo crear el directorio de modelos: ${dirError.message}`);
                }
            }
            
            // Verificar permisos del directorio de modelos
            try {
                const testModelFile = `${AppDirectory.ModelPath}test_permissions.txt`;
                await FileSystem.writeAsStringAsync(testModelFile, 'test', { encoding: 'utf8' });
                await FileSystem.deleteAsync(testModelFile);
                console.log(`✅ Permisos de escritura en ModelPath: OK`);
            } catch (modelPermError) {
                throw new Error(`❌ Sin permisos de escritura en directorio de modelos (${AppDirectory.ModelPath}): ${modelPermError.message}`);
            }
            
            Logger.infoToast(`✅ Permisos verificados correctamente`);
            
            // Mostrar información de las rutas
            console.log(`Información de rutas:`);
            console.log(`- FileSystem.documentDirectory: ${FileSystem.documentDirectory}`);
            console.log(`- AppDirectory.ModelPath: ${AppDirectory.ModelPath}`);
            console.log(`- Ubicación temporal: ${tempLocalUri}`);
            console.log(`- Ubicación final: ${destLocalUri}`);

            // 2. Limpiar archivo temporal si existe
            const tempFileInfo = await FileSystem.getInfoAsync(tempLocalUri);
            if (tempFileInfo.exists) {
                await FileSystem.deleteAsync(tempLocalUri);
                console.log(`Archivo temporal eliminado: ${tempLocalUri}`);
            }

            // 3. Limpiar archivo de destino si existe
            const destFileInfo = await FileSystem.getInfoAsync(destLocalUri);
            if (destFileInfo.exists) {
                await FileSystem.deleteAsync(destLocalUri);
                console.log(`Archivo de destino previo eliminado: ${destLocalUri}`);
            }

            // 3.5. Verificar la URL antes de descargar
            Logger.infoToast(`Verificando disponibilidad del modelo...`);
            console.log(`Verificando URL: ${modelUrl}`);
            
            try {
                // Hacer una petición HEAD para verificar la URL y obtener información del servidor
                const headResponse = await fetch(modelUrl, { 
                    method: 'HEAD',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; ModelDownloader/1.0)',
                    }
                });
                
                console.log(`Respuesta del servidor:`);
                console.log(`- Status: ${headResponse.status} (${headResponse.statusText})`);
                console.log(`- Content-Length: ${headResponse.headers.get('content-length')} bytes`);
                console.log(`- Content-Type: ${headResponse.headers.get('content-type')}`);
                console.log(`- Server: ${headResponse.headers.get('server')}`);
                
                const contentLength = headResponse.headers.get('content-length');
                const expectedSizeMB = contentLength ? (parseInt(contentLength) / (1024 * 1024)).toFixed(2) : 'desconocido';
                
                if (headResponse.status === 403) {
                    throw new Error(`🚫 Acceso prohibido (403): Hugging Face está bloqueando la descarga. Posibles soluciones:\n- Usar token de autenticación\n- Probar desde otra red\n- El modelo podría requerir aceptar términos`);
                } else if (headResponse.status === 404) {
                    throw new Error(`❌ Archivo no encontrado (404): La URL del modelo no existe o fue movida`);
                } else if (headResponse.status === 429) {
                    throw new Error(`⏸️ Demasiadas peticiones (429): El servidor está limitando las descargas. Intenta más tarde`);
                } else if (headResponse.status >= 400) {
                    throw new Error(`❌ Error del servidor (${headResponse.status}): ${headResponse.statusText}`);
                }
                
                if (!contentLength || parseInt(contentLength) === 0) {
                    throw new Error(`⚠️ El servidor no proporciona el tamaño del archivo. Esto podría indicar problemas con la URL`);
                }
                
                Logger.infoToast(`✅ Modelo verificado: ${expectedSizeMB} MB`);
                console.log(`Verificación exitosa. Tamaño esperado: ${expectedSizeMB} MB`);
                
            } catch (fetchError: any) {
                if (fetchError.message.includes('🚫') || fetchError.message.includes('❌') || fetchError.message.includes('⏸️')) {
                    throw fetchError; // Re-lanzar errores específicos que ya tienen formato
                }
                console.warn(`No se pudo verificar la URL (esto podría ser normal en algunos casos): ${fetchError.message}`);
                Logger.infoToast(`⚠️ No se pudo verificar la URL, procediendo con la descarga...`);
            }

            // 4. Descargar el archivo con progreso
            Logger.infoToast(`Descargando ${fileName}...`);
            let lastProgressUpdate = 0;
            
            const downloadResult = await FileSystem.downloadAsync(modelUrl, tempLocalUri, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ModelDownloader/1.0)',
                },
                onProgress: (data) => {
                    const progress = (data.totalBytesWritten / data.totalBytesExpectedToWrite) * 100;
                    const downloadedMB = data.totalBytesWritten / (1024 * 1024);
                    const totalMB = data.totalBytesExpectedToWrite / (1024 * 1024);
                    
                    console.log(`Datos de progreso - Escrito: ${data.totalBytesWritten}, Esperado: ${data.totalBytesExpectedToWrite}`);
                    
                    // Verificar que totalBytesExpectedToWrite no sea 0
                    if (data.totalBytesExpectedToWrite === 0) {
                        console.warn(`Advertencia: totalBytesExpectedToWrite es 0, podría indicar problemas con la descarga`);
                        Logger.infoToast(`Descargando: ${downloadedMB.toFixed(1)} MB (tamaño total desconocido)`);
                        return;
                    }
                    
                    // Actualizar progreso cada 10% para no saturar los logs
                    if (progress - lastProgressUpdate >= 10 || progress >= 100) {
                        lastProgressUpdate = progress;
                        Logger.infoToast(`Descargando: ${progress.toFixed(1)}% (${downloadedMB.toFixed(1)}/${totalMB.toFixed(1)} MB)`);
                        console.log(`Progreso de descarga: ${progress.toFixed(2)}% - ${downloadedMB.toFixed(2)}MB/${totalMB.toFixed(2)}MB`);
                    }
                }
            });

            console.log(`Resultado de descarga:`, downloadResult);

            // 5. Verificar que la descarga fue exitosa
            const downloadedFileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
            if (!downloadedFileInfo.exists) {
                throw new Error(`El archivo no se descargó correctamente en: ${downloadResult.uri}`);
            }

            const fileSizeBytes = downloadedFileInfo.size || 0;
            const fileSizeMB = fileSizeBytes / (1024 * 1024);
            console.log(`Archivo descargado - Tamaño: ${fileSizeBytes} bytes (${fileSizeMB.toFixed(2)} MB)`);
            
            // Verificar que el archivo no está vacío
            if (fileSizeBytes === 0) {
                throw new Error(`La descarga falló: el archivo está vacío (0 bytes). Verifica tu conexión a internet y la URL.`);
            }
            
            // Verificar que el archivo tiene un tamaño mínimo razonable (modelos GGUF suelen ser > 50MB)
            if (fileSizeBytes < 50 * 1024 * 1024) { // Menos de 50MB es sospechoso para este modelo
                throw new Error(`El archivo descargado parece estar incompleto. Tamaño: ${fileSizeMB.toFixed(2)} MB. Se esperaban al menos 50MB.`);
            }

            Logger.infoToast(`Descarga completada: ${fileSizeMB.toFixed(2)} MB`);

            // 6. Mover el archivo al directorio de modelos
            Logger.infoToast(`Moviendo archivo al directorio de modelos...`);
            await FileSystem.moveAsync({
                from: downloadResult.uri,
                to: destLocalUri,
            });

            // 7. Verificar que el archivo se movió correctamente y validar permisos finales
            const finalFileInfo = await FileSystem.getInfoAsync(destLocalUri);
            if (!finalFileInfo.exists) {
                throw new Error(`❌ Error al mover el archivo a: ${destLocalUri}`);
            }
            
            // Verificar que el archivo final tiene el mismo tamaño que el descargado
            const finalSizeBytes = finalFileInfo.size || 0;
            const finalSizeMB = finalSizeBytes / (1024 * 1024);
            
            console.log(`Archivo movido exitosamente:`);
            console.log(`- Ubicación: ${destLocalUri}`);
            console.log(`- Tamaño original: ${fileSizeBytes} bytes`);
            console.log(`- Tamaño final: ${finalSizeBytes} bytes`);
            console.log(`- Tamaños coinciden: ${fileSizeBytes === finalSizeBytes ? '✅' : '❌'}`);
            
            if (fileSizeBytes !== finalSizeBytes) {
                throw new Error(`❌ Error en la transferencia: el archivo cambió de tamaño durante el movimiento (${fileSizeMB.toFixed(2)}MB → ${finalSizeMB.toFixed(2)}MB)`);
            }
            
            // Probar permisos de lectura del archivo final
            try {
                const fileUri = await FileSystem.getInfoAsync(destLocalUri);
                if (!fileUri.isDirectory && fileUri.size && fileUri.size > 0) {
                    console.log(`✅ Archivo final accesible para lectura`);
                } else {
                    console.warn(`⚠️ Problema con el archivo final: es directorio=${fileUri.isDirectory}, tamaño=${fileUri.size}`);
                }
            } catch (readError) {
                console.warn(`⚠️ No se pudo verificar la legibilidad del archivo final: ${readError.message}`);
            }

            Logger.infoToast(`Archivo guardado exitosamente: ${finalSizeMB.toFixed(2)} MB`);

            // 8. Crear los datos del modelo
            Logger.infoToast(`Configurando modelo...`);
            const modelCreated = await Model.createModelData(fileName, true);
            
            if (modelCreated) {
                Logger.infoToast(`¡Modelo importado exitosamente!`);
                console.log(`Modelo ${fileName} importado correctamente`);
            } else {
                throw new Error(`Error al crear los datos del modelo`);
            }

        } catch (error: any) {
            const errorMessage = error.message || 'Error desconocido';
            Logger.errorToast(`Error: ${errorMessage}`);
            console.error("Error detallado:", error);
            console.error("Stack trace:", error.stack);

            // Limpiar archivos temporales en caso de error
            try {
                const tempExists = await FileSystem.getInfoAsync(tempLocalUri);
                if (tempExists.exists) {
                    await FileSystem.deleteAsync(tempLocalUri);
                    console.log(`Archivo temporal limpiado después del error`);
                }
            } catch (cleanupError) {
                console.error("Error limpiando archivo temporal:", cleanupError);
            }

        } finally {
            setModelImporting(false);
        }
    };

    return (
        <View>
            <PopupMenu
                placement="bottom"
                icon="addfile"
                disabled={modelImporting}
                options={[
                    {
                        label: 'Descargar Modelo GGUF',
                        icon: 'download',
                        onPress: handleImportModel,
                    },
                    {
                        label: 'Use External Model',
                        icon: 'link',
                        onPress: handleSetExternal,
                    },
                ]}
            />
        </View>
    )
}

export default ModelNewMenu
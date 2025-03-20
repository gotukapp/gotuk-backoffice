import {getDownloadURL, listAll, ref, uploadBytes} from "firebase/storage";
import {storage} from "./index.js";

export async function getAllFilesFromFolder(folderPath) {
    const folderRef = ref(storage, folderPath)
    try {
        const result = await listAll(folderRef)
        return await Promise.all(result.items.map(async (fileRef) => {
            return getDownloadURL(fileRef) // Get each file's URL
        }))
    } catch (error) {
        console.error("Error fetching files:", error)
        return []
    }
}

export function getStatusColor(status) {
    return status === 'pending' ? 'dark' : (status === 'approved' ? 'green' : 'red')
}

export function formatDate(timestamp) {
    if (!timestamp) return ""
    return new Date(timestamp.seconds * 1000).toLocaleDateString() // Adjust format as needed
}

export function openFilePicker(fileInput) {
    fileInput.click()
}

export async function uploadImages(path, selectedFiles, uploadProgress) {
    if (selectedFiles.length === 0) return
    let uploadedUrls = []

    for (let [index, file] of selectedFiles.entries()) {
        const storageRef = ref(storage, `${path}/${file.name}`)
        await uploadBytes(storageRef, file)
        uploadProgress = (index / selectedFiles.length) * 100
        const downloadUrl = await getDownloadURL(storageRef)
        uploadedUrls.push(downloadUrl)
    }

    return uploadedUrls
}

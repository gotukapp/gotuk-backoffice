import {getDownloadURL, listAll, ref} from "firebase/storage";
import {storage} from "./index.js";

export async function getAllFilesFromFolder(folderPath) {
    console.log(folderPath)
    const folderRef = ref(storage, folderPath)
    try {
        const result = await listAll(folderRef)
        console.log(result)
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

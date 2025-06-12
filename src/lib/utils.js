import {getDownloadURL, listAll, ref, uploadBytes, getMetadata} from "firebase/storage";
import {db, storage} from "./index.js";
import {collection, doc, getDocs, query, setDoc, updateDoc, where} from "firebase/firestore";

export async function getAllFilesFromFolder(folderPath) {
    const folderRef = ref(storage, folderPath)
    try {
        const result = await listAll(folderRef)
        return await Promise.all(result.items.map(async (fileRef) => {
            const url = await getDownloadURL(fileRef);
            const metadata = await getMetadata(fileRef);
            return {
                url,
                type: metadata.contentType // Example: "image/png", "application/pdf"
            };
        }));
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

export async function uploadImages(path, selectedFiles, onProgressUpdate) {
    if (selectedFiles.length === 0) return
    let uploadedUrls = []

    for (let [index, file] of selectedFiles.entries()) {
        const storageRef = ref(storage, `${path}/${file.name}`)
        await uploadBytes(storageRef, file)
        if (onProgressUpdate) {
            onProgressUpdate((index / selectedFiles.length) * 100);
        }
        const downloadUrl = await getDownloadURL(storageRef)
        uploadedUrls.push(downloadUrl)
    }

    return uploadedUrls
}

export function sortWithHighlightNews(objectList) {
    // Get the cutoff date (5 days ago)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const [recentObj, olderObj] = objectList.reduce(
        ([recent, old], org) => {
            const createdAt = org.creationDate?.toDate?.() || new Date(org.creationDate);
            if (createdAt >= fiveDaysAgo) {
                org.isNew = true
                recent.push(org);
            } else {
                old.push(org);
            }
            return [recent, old];
        },
        [[], []]
    );

    const sortByName = (a, b) => {
        const nameA = a.name?.trim().toLowerCase() || '';
        const nameB = b.name?.trim().toLowerCase() || '';

        if (!nameA && nameB) return 1;
        if (nameA && !nameB) return -1;
        return nameA.localeCompare(nameB);
    };

    return [
        ...recentObj.sort(sortByName),
        ...olderObj.sort(sortByName)
    ];
}

export function sendTicket(batch, subject, body) {
    sendEmail(batch, "support@gotuk.freshdesk.com", subject, body)
}

export function sendEmail(batch, email, subject, body) {
    const mailRef = doc(collection(db, "mail"));
    batch.set(mailRef, {
        to: [email],
        message: {
            subject: subject,
            html: body
        }
    });
}

export async function addDocumentationDate(entityName, docId, docRef, expirationDate, documentType) {
    const entityRef = doc(db, entityName, docId);
    const documentationRef = collection(db, "documentation");
    const q = query(
        documentationRef,
        where("entity", "==", entityRef),
        where("documentType", "==", documentType)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const existingDocRef = snapshot.docs[0].ref;
        await updateDoc(existingDocRef, {
            documentRef: docRef,
            expirationDate: expirationDate,
            emailWarning: "Not Sent"
        });
    } else {
        const newDocRef = doc(documentationRef); // Auto-generated ID
        await setDoc(newDocRef, {
            entity: entityRef,
            documentType: documentType,
            documentRef: docRef,
            expirationDate: expirationDate,
            emailWarning: "Not Sent"
        });
    }
}

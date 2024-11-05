<script context="module" lang="ts">
    import { doc, getDoc } from "firebase/firestore";
    import {db} from '$lib'

    export async function load({ params }) {
        const { id } = params;

        try {
            const docRef = doc(db, "trips", id); // Substitua "collectionName" pelo nome da sua coleção
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    props: {
                        documentData: docSnap.data(),
                    }
                };
            } else {
                return {
                    status: 404,
                    error: new Error("Documento não encontrado"),
                };
            }
        } catch (error) {
            return {
                status: 500,
                error: new Error("Erro ao carregar o documento"),
            };
        }
    }
</script>

<script>
    export let documentData;
</script>

<main>
    {#if documentData}
        <h1>Detalhes do Documento</h1>
        <pre>{JSON.stringify(documentData, null, 2)}</pre>
    {:else}
        <p>Carregando...</p>
    {/if}
</main>

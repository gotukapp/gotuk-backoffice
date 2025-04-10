<script>
    import {Modal, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from 'flowbite-svelte';
    import {collection, doc, getDocs, query, updateDoc, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {authUser} from '$lib/stores/authUser.js'
    import {SearchSolid, TrashBinSolid} from "flowbite-svelte-icons";

    let users = $state([])
    onMount(async () => {
        const firebaseUser = $authUser.user
        if (firebaseUser !== null) {
            const q = firebaseUser.isAdmin ?
                query(collection(db, "users"), where("guideMode", "==", true), where("disabled", "==", false)) :
                query(collection(db, "users"), where("guideMode", "==", true), where("disabled", "==", false), where("organizationRef", "==", firebaseUser.organizationRef))

            const querySnapshot = await getDocs(q);
            users = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        }
    });

    let isConfirmOpen = $state(null);
    let selectedGuideId = null;

    function openConfirmDialog(guideId) {
        selectedGuideId = guideId;
        isConfirmOpen = true;
    }

    async function disableGuide()
    {
        if (selectedGuideId) {
            await updateDoc(doc(db, "users", selectedGuideId),
                {
                    disabled: true,
                    accountValidated: false
                }
            )
            console.log(`Set guide disabled: ${selectedGuideId}`);
        }
        selectedGuideId = null;
        isConfirmOpen = false;
    }
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Guias
    </caption>
    <TableHead>
        <TableHeadCell>Nome</TableHeadCell>
        <TableHeadCell>Email</TableHeadCell>
        <TableHeadCell>Contacto</TableHeadCell>
        <TableHeadCell>Conta Aceite</TableHeadCell>
        <TableHeadCell>Estado</TableHeadCell>
        <TableHeadCell>Classificação</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Opções</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each users as user}
            <TableBodyRow>
                <TableBodyCell>{user.name}</TableBodyCell>
                <TableBodyCell>{user.email}</TableBodyCell>
                <TableBodyCell>{user.phone}</TableBodyCell>
                <TableBodyCell>{user.accountAccepted ? "Sim" : "Não"}</TableBodyCell>
                <TableBodyCell>{user.accountValidated ? "Ok" : "Não Validado"}</TableBodyCell>
                <TableBodyCell>{user.rating}</TableBodyCell>
                <TableBodyCell class="flex items-center space-x-4">
                    <a href="/guides/{user.id}" class="font-medium text-stone-500 hover:underline dark:text-stone-500"><SearchSolid/></a>
                    <button class="font-medium text-primary-600 hover:underline dark:text-primary-600"
                            onclick={() => { openConfirmDialog(user.id) }}>
                        <TrashBinSolid />
                    </button>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
        <Modal title="Apagar Guia" bind:open={isConfirmOpen} autoclose={false}>
            <p class="text-base text-gray-600">Tem a certeza que quer apagar este guia?</p>
            <svelte:fragment slot="footer">
                <button class="bg-red-600 text-white px-4 py-2 rounded" onclick={disableGuide}>Sim</button>
                <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded" onclick={() => isConfirmOpen = false}>Não</button>
            </svelte:fragment>
        </Modal>
    </TableBody>
</Table>
</div>

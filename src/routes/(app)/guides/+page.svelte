<script>
    import {Modal, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from 'flowbite-svelte';
    import {collection, doc, getDoc, onSnapshot, query, updateDoc, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {authUser} from '$lib/stores/authUser.js'
    import {SearchSolid, TrashBinSolid, CloseCircleSolid} from "flowbite-svelte-icons";
    import {writable} from "svelte/store";

    let orgNames = new Map();
    let users = writable([]);

    onMount(async () => {
        const firebaseUser = $authUser.user
        const q = firebaseUser?.isAdmin ?
            query(collection(db, "users"), where("guideMode", "==", true), where("disabled", "==", false)) :
            query(collection(db, "users"), where("guideMode", "==", true), where("disabled", "==", false), where("organizationRef", "==", firebaseUser?.organizationRef))

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            users.set(fetchedUsers);

            if (firebaseUser?.isAdmin) {
                await preloadOrganizations(fetchedUsers);
            }

            users.set(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });

        return () => unsubscribe(); //
    });

    let isDeleteConfirmOpen = $state(null);
    let isExcludeConfirmOpen = $state(null);
    let selectedGuideId = null;

    async function preloadOrganizations(usersList) {
        const orgRefs = usersList
            .map(u => u.organizationRef)
            .filter(ref => ref && !orgNames.has(ref.id));

        const promises = orgRefs.map(async (ref) => {
            try {
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    orgNames.set(ref.id, snap.data().name);
                } else {
                    orgNames.set(ref.id, "Unknown Org " + ref.id);
                }
            } catch (e) {
                console.error('Error loading organization:', ref.id, e);
                orgNames.set(ref.id, "Error loading " + ref.id);
            }
        });

        await Promise.all(promises);
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
        isDeleteConfirmOpen = false;
    }

    async function excludeGuide()
    {
        if (selectedGuideId) {
            await updateDoc(doc(db, "users", selectedGuideId),
                {
                    accountValidated: false,
                    accountAccepted: false,
                    organizationRef: null
                }
            )
            console.log(`Set guide disabled: ${selectedGuideId}`);
        }
        selectedGuideId = null;
        isExcludeConfirmOpen = false;
    }
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Guias
    </caption>
    <TableHead>
        <TableHeadCell>Nome</TableHeadCell>
        {#if $authUser.isAdmin}
            <TableHeadCell>Empresa</TableHeadCell>
        {/if}
        <TableHeadCell>Contacto</TableHeadCell>
        <TableHeadCell>Conta Aceite</TableHeadCell>
        <TableHeadCell>Estado</TableHeadCell>
        <TableHeadCell>Classificação</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Opções</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $users as user}
            <TableBodyRow>
                <TableBodyCell>{user.name}</TableBodyCell>
                {#if $authUser.isAdmin}
                    <TableBodyCell>
                        {#if user.organizationRef}
                            <a href="/organizations/{user.organizationRef.id}" class="font-medium text-stone-800 hover:underline dark:text-stone-500">
                                {orgNames.get(user.organizationRef.id) || 'Loading...'}
                            </a>
                        {/if}
                    </TableBodyCell>
                {/if}
                <TableBodyCell>{user.phone}</TableBodyCell>
                <TableBodyCell>{user.accountAccepted ? "Sim" : "Não"}</TableBodyCell>
                <TableBodyCell>{user.accountValidated ? "Ok" : "Blocked"}</TableBodyCell>
                <TableBodyCell>{user.rating}</TableBodyCell>
                <TableBodyCell class="flex items-center space-x-4">
                    <a href="/guides/{user.id}" class="font-medium text-stone-500 hover:underline dark:text-stone-500"><SearchSolid/></a>
                    {#if $authUser.isAdmin}
                        <button class="font-medium text-primary-600 hover:underline dark:text-primary-600"
                                onclick={() => {
                                    selectedGuideId = user.id;
                                    isDeleteConfirmOpen = true;
                                }}>
                            <TrashBinSolid />
                        </button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <button class="font-medium text-primary-600 hover:underline dark:text-primary-600"
                                onclick={() => {
                                    selectedGuideId = user.id;
                                    isExcludeConfirmOpen = true;
                                }}>
                            <CloseCircleSolid />
                        </button>
                    {/if}
                </TableBodyCell>
            </TableBodyRow>
        {/each}
        <Modal title="Apagar Guia" bind:open={isDeleteConfirmOpen} autoclose={false}>
            <p class="text-base text-gray-600">Tem a certeza que quer apagar este guia?</p>
            <svelte:fragment slot="footer">
                <button class="bg-red-600 text-white px-4 py-2 rounded" onclick={disableGuide}>Sim</button>
                <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded" onclick={() => isDeleteConfirmOpen = false}>Não</button>
            </svelte:fragment>
        </Modal>
        <Modal title="Excluir Guia" bind:open={isExcludeConfirmOpen} autoclose={false}>
            <p class="text-base text-gray-600">Tem a certeza que quer excluir este guia da sua empresa?</p>
            <svelte:fragment slot="footer">
                <button class="bg-red-600 text-white px-4 py-2 rounded" onclick={excludeGuide()}>Sim</button>
                <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded" onclick={() => isExcludeConfirmOpen = false}>Não</button>
            </svelte:fragment>
        </Modal>
    </TableBody>
</Table>
</div>

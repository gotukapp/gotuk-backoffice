<script>
    import {Modal, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from 'flowbite-svelte';
    import {collection, doc, onSnapshot, query, updateDoc, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {authUser} from '$lib/stores/authUser.js'
    import {SearchSolid, TrashBinSolid, CloseCircleSolid} from "flowbite-svelte-icons";
    import {get, writable} from "svelte/store";
    import {getOrgName} from "$lib/stores/organizations.js";
    import {sortWithHighlightNews} from "$lib/utils.js";

    export const orgNames = writable(new Map());
    let users = writable([]);

    onMount(async () => {
        const firebaseUser = $authUser.user
        const q = firebaseUser?.isAdmin ?
            query(collection(db, "users"), where("guideMode", "==", true), where("disabled", "==", false)) :
            query(collection(db, "users"), where("guideMode", "==", true), where("disabled", "==", false), where("organizationRef", "==", firebaseUser?.organizationRef))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sortedUsers = sortWithHighlightNews(fetchedUsers);

            users.set(sortedUsers);

            if (firebaseUser?.isAdmin) {
                loadOrganizations();
            }
        });

        return () => unsubscribe(); //
    });

    let isDeleteConfirmOpen = $state(null);
    let isExcludeConfirmOpen = $state(null);
    let selectedGuideId = null;

    async function loadOrganizations() {
        const currentUsers = get(users);
        const updatedUsers = [...currentUsers];

        const promises = updatedUsers.map(async (user) => {
            try {
                user.orgName = await getOrgName(user.organizationRef)
            } catch (e) {
                console.error('Error loading organization:', user.organizationRef.id, e);
                user.orgName = "Error loading " + user.organizationRef.id;
            }
        });

        await Promise.all(promises);
        users.set(updatedUsers);
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
            <TableBodyRow class={user.isNew ? 'bg-orange-100' : ''}>
                <TableBodyCell>{user.name}</TableBodyCell>
                {#if $authUser.isAdmin}
                    <TableBodyCell>
                        {#if user.organizationRef}
                            <a href="/organizations/{user.organizationRef.id}" class="font-medium text-stone-800 hover:underline dark:text-stone-500">
                                {user.orgName || 'Loading...'}
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

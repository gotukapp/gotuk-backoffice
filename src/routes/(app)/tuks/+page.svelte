<script>
    import {
        Button, Input, Label,
        Modal,
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
        Spinner, Radio, Toggle, Helper
    } from 'flowbite-svelte';
    import {
        collection,
        doc,
        onSnapshot,
        query,
        serverTimestamp,
        setDoc, updateDoc,
        where
    } from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {get, writable} from "svelte/store";
    import {authUser} from '$lib/stores/authUser.js'
    import {SearchSolid, TrashBinSolid, CirclePlusSolid} from "flowbite-svelte-icons";
    import {getOrg} from "$lib/stores/organizations.js";

    let tuks = writable([]);
    let createForm = false;
    let isCreating = false;
    let licensePlate = '';
    let seats = "4";
    let isElectric = true;
    let licensePlateError = false;

    let total = writable(0);
    let totalOk = writable(0);

    export const orgNames = writable(new Map());

    onMount(() => {
        const firebaseUser = $authUser.user
        const q = firebaseUser?.isAdmin ?
            query(collection(db, "tuktuks"), where("disabled", "==", false)) :
            query(collection(db, "tuktuks"), where("organizationRef", "==", firebaseUser?.organizationRef), where("disabled", "==", false))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTuks = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

            // Get the cutoff date (5 days ago)
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            const [recentTuks, olderTuks] = fetchedTuks.reduce(
                ([recent, old], tuk) => {
                    const createdAt = tuk.creationDate?.toDate?.() || new Date(tuk.creationDate);
                    if (createdAt >= fiveDaysAgo) {
                        tuk.isNew = true
                        recent.push(tuk);
                    } else {
                        old.push(tuk);
                    }
                    return [recent, old];
                },
                [[], []]
            );

            const sortByName = (a, b) => {
                const nameA = a.licensePlate?.trim().toLowerCase() || '';
                const nameB = b.licensePlate?.trim().toLowerCase() || '';

                if (!nameA && nameB) return 1;
                if (nameA && !nameB) return -1;
                return nameA.localeCompare(nameB);
            };

            const sortedTuks = [
                ...recentTuks.sort(sortByName),
                ...olderTuks.sort(sortByName)
            ];

            total = sortedTuks.length
            totalOk = sortedTuks.filter(t => t.isValid).length

            tuks.set(sortedTuks);

            if (firebaseUser?.isAdmin) {
                preloadOrganizations(fetchedTuks);
            }
        });

        return () => unsubscribe(); // Cleanup on unmount
    });

    async function preloadOrganizations() {
        const currentTuks = get(tuks);

        const promises = currentTuks.map(async (tuk) => {
            try {
                tuk.orgName = (await getOrg(tuk.organizationRef)).name
            } catch (e) {
                console.error('Error loading organization:', tuk.organizationRef.id, e);
                tuk.orgName = "Error loading " + tuk.organizationRef.id;
            }
        });

        await Promise.all(promises);
        tuks.set(currentTuks);
    }

    function validateLicensePlate(event) {
        const plate = event.target.value.toUpperCase().trim();
        const regex = /^(?:\d{2}-[A-Z]{2}-\d{2}|[A-Z]{2}-\d{2}-[A-Z]{2}|\d{2}-\d{2}-[A-Z]{2})$/

        licensePlateError = !regex.test(plate);
    }

    function formatLicensePlate(event) {
        licensePlate = event.target.value.toUpperCase()
    }

    let isConfirmOpen = false;
    let selectedTukId = null;

    function openConfirmDialog(tukId) {
        selectedTukId = tukId;
        isConfirmOpen = true;
    }

    async function disableTuk()
    {
        if (selectedTukId) {
            await updateDoc(doc(db, "tuktuks", selectedTukId), { disabled: true})
            console.log(`Set disabled tuk: ${selectedTukId}`);
        }
        selectedTukId = null;
        isConfirmOpen = false;
    }

    async function addTuk() {
        isCreating = true

        if (licensePlateError) {
            isCreating = false
            return
        }

        await setDoc(doc(collection(db, "tuktuks"), licensePlate), {
            licensePlate: licensePlate,
            electric: isElectric,
            seats: parseInt(seats),
            organizationRef: $authUser.user.organizationRef,
            disabled: false,
            isValid: false,
            creationDate: serverTimestamp()
        });

        isCreating = false
        createForm = false
    }
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <div class="flex justify-between items-center w-full">
            <span>Tuks <span class="text-sm text-gray-700 spa">(Registados: {total}</span><span class="text-sm text-gray-700 ml-4">Aprovados: {totalOk})</span></span>
            {#if !$authUser.isAdmin }
                <Button pill color="light" on:click={() => createForm = true}><CirclePlusSolid class="mr-2" />Adicionar</Button>
            {/if}
        </div>
    </caption>
    <TableHead>
        <TableHeadCell>Matrícula</TableHeadCell>
        {#if $authUser.isAdmin}
            <TableHeadCell>Empresa</TableHeadCell>
        {/if}
        <TableHeadCell class="max-w-[50px]">Lugares</TableHeadCell>
        <TableHeadCell class="max-w-[50px]">Eléctrico</TableHeadCell>
        <TableHeadCell>Estado</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Opções</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $tuks as tuk}
            <TableBodyRow class={tuk.isNew ? 'bg-orange-100' : ''}>
                <TableBodyCell>{tuk.licensePlate}</TableBodyCell>
                {#if $authUser.isAdmin}
                    <TableBodyCell class="max-w-[150px] truncate">
                        {#if tuk.organizationRef}
                            <a href="/organizations/{tuk.organizationRef.id}" class="font-medium text-stone-800 hover:underline dark:text-stone-500">
                                {tuk.orgName || 'Loading...'}
                            </a>
                        {/if}
                    </TableBodyCell>
                {/if}
                <TableBodyCell class="max-w-[50px]">{tuk.seats}</TableBodyCell>
                <TableBodyCell class="max-w-[50px]">{tuk.electric ? "Yes" : "No"}</TableBodyCell>
                <TableBodyCell class="max-w-[50px]">{tuk.isValid ? "Ok" : "Blocked"}</TableBodyCell>
                <TableBodyCell class="flex items-center space-x-4">
                    <a href="/tuks/{tuk.id}" class="font-medium text-stone-500 hover:underline dark:text-stone-500"><SearchSolid/></a>
                    <button class="font-medium text-primary-600 hover:underline dark:text-primary-600"
                            onclick={() => { openConfirmDialog(tuk.id) }}>
                        <TrashBinSolid />
                    </button>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
    <Modal title="Apagar Tuk" bind:open={isConfirmOpen} autoclose={false}>
        <p class="text-base text-gray-600">Tem a certeza que quer apagar este Tuk?</p>
        <svelte:fragment slot="footer">
            <button class="bg-red-600 text-white px-4 py-2 rounded" onclick={disableTuk}>Sim</button>
            <button class="bg-gray-300 text-gray-700 px-4 py-2 rounded" onclick={() => isConfirmOpen = false}>Não</button>
        </svelte:fragment>
    </Modal>
    <Modal title="Novo Tuk" bind:open={createForm} autoclose={!createForm}>
        <div class="mb-6">
            <Label for="input-group-1" class="block mb-2">Matricula</Label>
            <Input id="companyName" bind:value={licensePlate} on:input={formatLicensePlate}  on:blur={validateLicensePlate}/>
            {#if licensePlateError}
                <Helper class='mt-2' color='red'><span class="font-medium">Matrícula inválida! Exemplo válido: 12-34-AB, AB-12-CD.</span></Helper>
            {/if}
        </div>
        <div class="mb-6">
            <Label for="input-group-1" class="block mb-2">Lugares</Label>
            <div class="flex gap-4 items-center">
                <Radio name="seats" value="4" bind:group={seats}>4</Radio>
                <Radio name="seats" value="6" bind:group={seats}>6</Radio>
            </div>
        </div>
        <div class="mb-6">
            <Label for="input-group-1" class="block mb-2">Eléctrico</Label>
            <Toggle bind:checked={isElectric}></Toggle>
        </div>
        <svelte:fragment slot="footer">
            <Button on:click={() => addTuk()}>{#if isCreating}<Spinner class="me-3" size="4" />{/if}Guardar</Button>
        </svelte:fragment>
    </Modal>
</Table>
</div>

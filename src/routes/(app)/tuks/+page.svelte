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
        setDoc,
        where
    } from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {writable} from "svelte/store";
    import {authUser} from '$lib/stores/authUser.js'
    let tuks = writable([]);
    let createForm = false;
    let isCreating = false;
    let licensePlate = '';
    let seats = "4";
    let isElectric = true;
    let licensePlateError = false;

    onMount(async () => {
        const firebaseUser = $authUser.user
        const q = firebaseUser?.isAdmin ?
            collection(db, "tuktuks") :
            query(collection(db, "tuktuks"), where("organizationRef", "==", firebaseUser?.organizationRef))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            tuks.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe(); // Cleanup on unmount
    });

    function validateLicensePlate(event) {
        const plate = event.target.value.toUpperCase().trim();
        const regex = /^(?:\d{2}-[A-Z]{2}-\d{2}|[A-Z]{2}-\d{2}-[A-Z]{2}|\d{2}-\d{2}-[A-Z]{2})$/

        licensePlateError = !regex.test(plate);
    }

    function formatLicensePlate(event) {
        licensePlate = event.target.value.toUpperCase()
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
            <span>Tuks</span>
            <Button pill color="light" on:click={() => createForm = true}>Add</Button>
        </div>
    </caption>
    <TableHead>
        <TableHeadCell>License Plate</TableHeadCell>
        <TableHeadCell>Seats</TableHeadCell>
        <TableHeadCell>Electric</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $tuks as tuk}
            <TableBodyRow>
                <TableBodyCell>{tuk.licensePlate}</TableBodyCell>
                <TableBodyCell>{tuk.seats}</TableBodyCell>
                <TableBodyCell>{tuk.electric}</TableBodyCell>
                <TableBodyCell>
                    <a href="/tuks/{tuk.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
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

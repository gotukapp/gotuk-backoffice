<script>
    import {
        Card,
        Spinner,
        Button,
        Label,
        Input,
        TableBodyCell,
        TableHeadCell,
        TableBody,
        Table,
        TableHead, TableBodyRow
    } from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import {collection, doc, onSnapshot, query, where} from "firebase/firestore";
    import { page } from "$app/stores";
    import {writable} from "svelte/store";

    let document = writable(null);
    let loading = true;
    let error = null;
    let tuks = writable([]);
    let users = writable([]);

    onMount(() => {
        try {
            const id = $page.params.id;
            const docRef = doc(db, "organizations", id);

            // Listen for organization changes
            const unsubscribeOrg = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    document = docSnap.data();
                } else {
                    error = "Documento não encontrado!";
                }
            });

            // Listen for live updates in tuks
            const qTuks = query(collection(db, "tuktuks"), where("organizationRef", "==", docRef));
            const unsubscribeTuks = onSnapshot(qTuks, (querySnapshot) => {
                tuks.set(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

            // Listen for live updates in users
            const qUsers = query(collection(db, "users"), where("organizationRef", "==", docRef));
            console.log("Querying for tuktuks with organizationRef:", docRef.path);
            const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
                console.log("Users found:", querySnapshot.docs.length);
                users.set(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

            return () => {
                unsubscribeOrg();
                unsubscribeTuks();
                unsubscribeUsers();
            };
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });
</script>
<div class="w-full" style="margin: 20px">
    <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>

    {#if loading}
        <p style="margin-top: 20px"><Spinner/> Loading Organization...</p>
    {:else if error}
        <p>{error}</p>
    {:else}
        <Card size="xl" style="margin-top: 20px">
            <div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Name</Label>
                    <Input id="name" bind:value={document.name} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">VAT</Label>
                    <Input id="name" bind:value={document.vat} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Address</Label>
                    <Input id="name" bind:value={document.address} readonly/>
                </div>
            </div>
        </Card>
        <Card size="xl" style="margin-top: 20px">
            <Table >
                <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                    Tuks
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
            </Table>
        </Card>
        <Card size="xl" style="margin-top: 20px">
            <Table >
                <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                    Guides
                </caption>
                <TableHead>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Email</TableHeadCell>
                    <TableHeadCell>Phone</TableHeadCell>
                    <TableHeadCell>Account Status</TableHeadCell>
                    <TableHeadCell>Rating</TableHeadCell>
                    <TableHeadCell>
                        <span class="sr-only">Ver</span>
                    </TableHeadCell>
                </TableHead>
                <TableBody tableBodyClass="divide-y">
                    {#each $users as user}
                        <TableBodyRow>
                            <TableBodyCell>{user.name}</TableBodyCell>
                            <TableBodyCell>{user.email}</TableBodyCell>
                            <TableBodyCell>{user.phone}</TableBodyCell>
                            <TableBodyCell>{user.accountValidated ? "Valid" : "Blocked"}</TableBodyCell>
                            <TableBodyCell>{user.rating}</TableBodyCell>
                            <TableBodyCell>
                                <a href="/guides/{user.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                            </TableBodyCell>
                        </TableBodyRow>
                    {/each}
                </TableBody>
            </Table>
        </Card>
    {/if}
</div>
<style>
    hr.double {
        background-color: #999;
        border: 0 none;
        color: #eee;
        height: 2px;
        margin-bottom: 10px;
    }
</style>

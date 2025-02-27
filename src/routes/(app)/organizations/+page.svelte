<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, doc, getCountFromServer, onSnapshot, query, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import { writable } from "svelte/store";

    let orgs = writable([]);

    onMount(async () => {
        const unsubscribe = onSnapshot(collection(db, "organizations"), async (snapshot) => {
            const organizations = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const orgData = { id: docSnap.id, ...docSnap.data() };

                // Query for number of Tuks associated with this organization
                const tuksQuery = query(collection(db, "tuktuks"), where("organizationRef", "==", doc(db, "organizations", orgData.id)));
                const tuksCount = (await getCountFromServer(tuksQuery)).data().count;

                // Query for number of Tuks associated with this organization
                const guidesQuery = query(collection(db, "users"), where("organizationRef", "==", doc(db, "organizations", orgData.id)));
                const guidesCount = (await getCountFromServer(guidesQuery)).data().count;

                return { ...orgData, tuksCount, guidesCount };
            }));

            orgs.set(organizations);
        });

        return () => unsubscribe(); // Cleanup on unmount
    });
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Organizations
    </caption>
    <TableHead>
        <TableHeadCell>Name</TableHeadCell>
        <TableHeadCell>Tuks</TableHeadCell>
        <TableHeadCell>Guides</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $orgs as org}
            <TableBodyRow>
                <TableBodyCell>{org.name}</TableBodyCell>
                <TableBodyCell>{org.tuksCount}</TableBodyCell>
                <TableBodyCell>{org.guidesCount}</TableBodyCell>
                <TableBodyCell>
                    <a href="/organizations/{org.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>

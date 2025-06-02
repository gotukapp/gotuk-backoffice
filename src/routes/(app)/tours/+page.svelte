<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import { collection, getDocs } from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {authUser} from '$lib/stores/authUser.js'
    import {goto} from "$app/navigation";

    let tours = $state([])

    onMount(async () => {
        const firebaseUser = $authUser.user
        if (!firebaseUser?.isAdmin) {
            await goto('/organizations');
        }

        const querySnapshot = await getDocs(collection(db, "tours"));
        tours = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Tours
    </caption>
    <TableHead>
        <TableHeadCell>Name</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each tours as tour}
            <TableBodyRow>
                <TableBodyCell>{tour.name}</TableBodyCell>
                <TableBodyCell>{tour.rating}</TableBodyCell>
                <TableBodyCell>{tour.isActive}</TableBodyCell>
                <TableBodyCell>
                    <a href="/tours/{tour.id}" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Ver</a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>

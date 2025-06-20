<script>
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import {collection, doc, getCountFromServer, onSnapshot, query, where} from "firebase/firestore";
    import {onMount} from "svelte";
    import {db} from '$lib'
    import { writable } from "svelte/store";
    import { authUser } from '$lib/stores/authUser.js'
    import {goto} from "$app/navigation";
    import {SearchSolid} from "flowbite-svelte-icons";
    import {sortWithHighlightNews} from "$lib/utils.js";

    let orgs = writable([]);
    let unsubscribe;

    onMount(async () => {
        if ($authUser.isAdmin) {
            unsubscribe = onSnapshot(collection(db, "organizations"), async (snapshot) => {
                const organizations = await Promise.all(snapshot.docs.map(async (docSnap) => {
                    const orgData = {id: docSnap.id, ...docSnap.data()};

                    // Query for number of Tuks associated with this organization
                    const tuksQuery = query(collection(db, "tuktuks")
                        , where("organizationRef", "==", doc(db, "organizations", orgData.id))
                        , where("disabled", "==", false));
                    const tuksCount = (await getCountFromServer(tuksQuery)).data().count;

                    // Query for number of Tuks associated with this organization
                    const guidesQuery = query(collection(db, "users")
                        , where("organizationRef", "==", doc(db, "organizations", orgData.id))
                        , where("disabled", "==", false)
                        , where("guideMode", "==", true));
                    const guidesCount = (await getCountFromServer(guidesQuery)).data().count;

                    return {...orgData, tuksCount, guidesCount};
                }));

                const sortedOrgs = sortWithHighlightNews(organizations);

                orgs.set(sortedOrgs);
            });
        }

        return () => unsubscribe ?? unsubscribe(); // Cleanup on unmount
    });

    $: {
        if ($authUser && !$authUser.isAdmin && $authUser.user?.organizationRef?.id) {
            goto('/organizations/' + $authUser.user.organizationRef.id);
        }
    }
</script>
<div class="w-full">
<Table >
    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        Organizations
    </caption>
    <TableHead>
        <TableHeadCell>Name</TableHeadCell>
        <TableHeadCell>Status</TableHeadCell>
        <TableHeadCell>Tuks</TableHeadCell>
        <TableHeadCell>Guides</TableHeadCell>
        <TableHeadCell>
            <span class="sr-only">Edit</span>
        </TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
        {#each $orgs as org}
            <TableBodyRow class={org.isNew ? 'bg-orange-100' : ''}>
                <TableBodyCell>{org.name}</TableBodyCell>
                <TableBodyCell>{org.isValid ? "Ok" : "Blocked"}</TableBodyCell>
                <TableBodyCell>{org.tuksCount}</TableBodyCell>
                <TableBodyCell>{org.guidesCount}</TableBodyCell>
                <TableBodyCell>
                    <a href="/organizations/{org.id}" class="font-medium text-stone-500 hover:underline dark:text-stone-500"><SearchSolid/></a>
                </TableBodyCell>
            </TableBodyRow>
        {/each}
    </TableBody>
</Table>
</div>

<script>
    import { Card, Spinner, Button, Label, Input } from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import { doc, getDoc } from "firebase/firestore";
    import { page } from "$app/stores";

    let document = null;
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            const id = $page.params.id;
            const docRef = doc(db, "tuktuks", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                document = docSnap.data();
            } else {
                error = "Documento não encontrado!";
            }
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });
</script>
<div class="w-full" style="margin: 20px">
    <div class="flex items-center space-x-2">
        <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>
        {#if !loading}
            <Label for="input-group-1" class="text-gray-900">Tuk: {document.licensePlate}</Label>
        {/if}
    </div>
    {#if loading}
        <p style="margin-top: 20px"><Spinner/> Loading Tuk...</p>
    {:else if error}
        <p>{error}</p>
    {:else}
        <Card size="lg" style="margin-top: 20px">
            <div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Seats</Label>
                    <Input id="name" bind:value={document.seats} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Electric</Label>
                    <Input id="name" bind:value={document.electric} readonly/>
                </div>
            </div>
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

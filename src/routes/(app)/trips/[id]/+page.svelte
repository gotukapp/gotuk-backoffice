<script>
    import { Badge, Card, Spinner, Button, Label, Input } from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import { doc, getDoc } from "firebase/firestore";
    import { page } from "$app/stores"; // Para acessar o ID da URL

    export let data; // Opcional, se estiver usando carregamento no server

    let document = null;
    let carregando = true;
    let erro = null;
    let reservationDate = '';
    let creationDate = '';
    let acceptedDate = '';
    let startedDate = '';
    let finishedDate = '';
    let client = null;
    let clientId = '';
    let guide = null;
    let guideName = '';
    let guideId = '';
    let tour = null;
    let tourId = '';
    let tripStatus = '';
    let statusColor = 'gray';

    onMount(async () => {
        try {
            const id = $page.params.id; // Pegando o ID da rota
            const docRef = doc(db, "trips", id); // Substitua "sua_colecao" pelo nome da sua coleção
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                document = docSnap.data();

                if (document.tourId) {
                    const tourSnap = await getDoc(document.tourId);
                    if (tourSnap.exists()) {
                        tour = tourSnap.data();
                        tourId = tourSnap.id;
                    }
                }

                if (document.clientRef) {
                    const clientSnap = await getDoc(document.clientRef);
                    if (clientSnap.exists()) {
                        client = clientSnap.data();
                        clientId = clientSnap.id;
                    }
                }

                if (document.guideRef) {
                    const guideSnap = await getDoc(document.guideRef);
                    if (guideSnap.exists()) {
                        guide = guideSnap.data();
                        guideName = guide.name
                        guideId = guideSnap.id;
                    }
                }

                tripStatus = document.status.toUpperCase()
                statusColor = document.status === 'pending' ? 'gray'
                        : (document.status === 'booked' ? 'yellow'
                        : (document.status === 'started' ? 'green'
                        : (document.status === 'canceled' ? 'red'
                        : (document.status === 'finished' ? 'blue' : 'black'))))
                reservationDate = document.date.toDate().toLocaleString()
                creationDate = document.creationDate.toDate().toLocaleString()
                acceptedDate = document.acceptedDate?.toDate().toLocaleString()
                startedDate = document.startedDate?.toDate().toLocaleString()
                finishedDate = document.finishedDate?.toDate().toLocaleString()
            } else {
                erro = "Documento não encontrado!";
            }
        } catch (e) {
            erro = "Erro ao carregar documento: " + e.message;
        } finally {
            carregando = false;
        }
    });
</script>
<div class="w-full" style="margin: 20px">
    <div class="flex items-center space-x-2">
        <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>
        {#if !carregando}
            <Label for="input-group-1" class="text-gray-900">Trip: {document.reservationId}</Label>
        {/if}
    </div>
    {#if carregando}
        <p style="margin-top: 20px"><Spinner/> Loading Trip...</p>
    {:else if erro}
        <p>{erro}</p>
    {:else}
        <Card size="lg" style="margin-top: 20px">
            <Badge border color="{statusColor}">{tripStatus}</Badge>
            <div style="padding-top: 10px">
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Reservation Date</Label>
                    <Input id="creationDate" bind:value={reservationDate} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Tour</Label>
                    <div class="flex items-center space-x-2">
                        <Input id="status" bind:value={tour.name} readonly
                               class="input input-bordered input-primary" />
                        <a href={`../tours/${tourId}`} class="text-blue-500 hover:text-blue-700">View</a>
                    </div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Client</Label>
                    <div class="flex items-center space-x-2">
                        <Input id="status" bind:value={client.name} readonly
                                class="input input-bordered input-primary" />
                        {#if document.clientRef}
                            <a href={`../clients/${clientId}`} class="text-blue-500 hover:text-blue-700">View</a>
                        {/if}
                    </div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Guide</Label>
                    <div class="flex items-center space-x-2">
                        <Input id="status" bind:value={guideName} readonly
                               class="input input-bordered input-primary" />
                        {#if document.guideRef}
                            <a href={`../guides/${guideId}`} class="text-blue-500 hover:text-blue-700">View</a>
                        {/if}
                    </div>
                </div>
                <hr class="double">
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Creation Date</Label>
                    <Input id="creationDate" bind:value={creationDate} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Accepted Date</Label>
                    <Input id="acceptedDate" bind:value={acceptedDate} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Started Date</Label>
                    <Input id="startedDate" bind:value={startedDate} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Finished Date</Label>
                    <Input id="finishedDate" bind:value={finishedDate} readonly/>
                </div>
                <hr class="double">
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

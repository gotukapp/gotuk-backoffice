<script>
    import {
        Badge,
        Card,
        Spinner,
        Button,
        Label,
        Input,
        Timeline,
        TimelineItem,
        Rating,
        Textarea, Modal, Select
    } from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import {
        collection,
        doc,
        getDoc,
        serverTimestamp,
        onSnapshot,
        addDoc,
        updateDoc,
        query, orderBy
    } from "firebase/firestore";
    import { page } from "$app/stores";
    import { CalendarWeekSolid, PlaySolid, CheckCircleSolid, FlagSolid, CloseCircleSolid } from 'flowbite-svelte-icons';
    import { auth } from '$lib';
    import {writable} from "svelte/store";

    let cancelConfirmation = false;
    let guidesAvailable = false;
    let tripId = null;
    let tripDoc = writable(null);
    let tripEvents = writable([]);
    let guideReviewDoc = null;
    let tourReviewDoc = null;
    let loading = true;
    let erro = null;
    let reservationDate = '';
    let reservationType = '';
    let client = null;
    let clientId = '';
    let guide = null;
    let guideName = '';
    let guideId = '';
    let tour = null;
    let tourId = '';
    let tripStatus = '';
    let statusColor = 'gray';
    let unsubscribeTrip;
    let unsubscribeEvents;
    let cancelReasons = [
        { value: 'guideNoShow', name: 'Guide did not show up' },
        { value: 'clientNoShow', name: 'Client did not show up' },
        { value: 'guideRequest', name: 'Guide Request' },
        { value: 'clientRequest', name: 'Client Request' },
    ];
    let selectedCancelReason = '';
    let notes = '';

    onMount(async () => {
        try {
            tripId = $page.params.id;
            const docRef = doc(db, "trips", tripId);

            unsubscribeTrip = onSnapshot(docRef, async (docSnap) => {
                try {
                    if (docSnap.exists()) {
                        tripDoc = docSnap.data();

                        if (tripDoc.tourId) {
                            const tourSnap = await getDoc(tripDoc.tourId);
                            if (tourSnap.exists()) {
                                tour = tourSnap.data();
                                tourId = tourSnap.id;
                            }
                        }

                        if (tripDoc.clientRef) {
                            const clientSnap = await getDoc(tripDoc.clientRef);
                            if (clientSnap.exists()) {
                                client = clientSnap.data();
                                clientId = clientSnap.id;
                            }
                        }

                        if (tripDoc.guideRef) {
                            const guideSnap = await getDoc(tripDoc.guideRef);
                            if (guideSnap.exists()) {
                                guide = guideSnap.data();
                                guideName = guide.name
                                guideId = guideSnap.id;
                            }
                        }

                        if (tripDoc.rateSubmitted) {
                            const tourReviewsCollectionRef = collection(tripDoc.tourId, "reviews");
                            const tourReviewSnap = await getDoc(doc(tourReviewsCollectionRef, docSnap.id));
                            if (tourReviewSnap.exists()) {
                                tourReviewDoc = tourReviewSnap.data();
                            }
                            const guideReviewsCollectionRef = collection(tripDoc.guideRef, "reviews");
                            const guideReviewSnap = await getDoc(doc(guideReviewsCollectionRef, docSnap.id));
                            if (guideReviewSnap.exists()) {
                                guideReviewDoc = guideReviewSnap.data();
                            }
                        }

                        tripStatus = tripDoc.status.toUpperCase()
                        statusColor = tripDoc.status === 'pending' ? 'gray'
                            : (tripDoc.status === 'booked' ? 'yellow'
                                : (tripDoc.status === 'started' ? 'green'
                                    : (tripDoc.status === 'canceled' ? 'red'
                                        : (tripDoc.status === 'finished' ? 'blue' : 'black'))))
                        reservationDate = tripDoc.date.toDate().toLocaleString()
                        reservationType = tripDoc.reservationType

                    } else {
                        erro = "Documento não encontrado!";
                    }
                } catch (e) {
                    erro = "Erro ao carregar documento: " + e.message;
                } finally {
                    loading = false;
                }
            });

            const tripEventsCollectionRef = collection(docRef, "events");
            const q = query(tripEventsCollectionRef, orderBy("creationDate"));

            unsubscribeEvents = onSnapshot(q, (querySnapshot) => {
                let events = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                tripEvents.set(events);
            });

            return () => {
                if (unsubscribeTrip) unsubscribeTrip();
                if (unsubscribeEvents) unsubscribeEvents();
            };
        } catch (e) {
            erro = "Erro ao carregar documento: " + e.message;
        }
    });

    function searchAvailableGuides() {
        guidesAvailable = true;

    }

    function eventReason(reason) {
        if (reason === "clientRequest") {
            return "Client request"
        }

        if (reason === "guideRequest") {
            return "Guide request"
        }

        if (reason === "guideUnavailable") {
            return "No available guides were found"
        }

        return reason
    }

    const cancelTrip = async (date, reason, notes) => {
        const docRef = doc(db, "trips", tripId);
        const actionsCollection = collection(docRef, "events");
        await addDoc(actionsCollection, {
            "creationDate": serverTimestamp(),
            "action": "canceled",
            "reason": reason,
            "notes": notes,
            "createdBy": auth.currentUser.uid
        })
        await updateDoc(docRef, "canceledDate", serverTimestamp(), "status", "canceled")
        cancelConfirmation = false;
    };
</script>
<div class="w-full" style="margin: 20px">
    <div class="flex items-center space-x-2">
        <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>
        {#if !loading}
            <Label for="input-group-1" class="text-gray-900">Trip: {tripDoc.reservationId}</Label>
        {/if}
    </div>
    {#if loading}
        <p style="margin-top: 20px"><Spinner/> Loading Trip...</p>
    {:else if erro}
        <p>{erro}</p>
    {:else}
        <Card size="xl" style="margin-top: 20px">
            <Badge border color="{statusColor}">{tripStatus}</Badge>
            <div style="padding-top: 20px">
                <div class="row">
                    <div style="float: left; width: 55%">
                        <div class="row">
                            <div class="mb-6" style="float: left; width: 70%">
                                <Label for="input-group-1" class="block mb-2">Reservation Date</Label>
                                <Input id="creationDate" bind:value={reservationDate} readonly/>
                            </div>
                            <div class="mb-6" style="float: right; width: 20%">
                                <Label for="input-group-1" class="block mb-2">Reservation Type</Label>
                                <Input id="creationDate" bind:value={reservationType} readonly/>
                            </div>
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
                                {#if tripDoc.clientRef}
                                    <a href={`../clients/${clientId}`} class="text-blue-500 hover:text-blue-700">View</a>
                                {/if}
                            </div>
                        </div>
                        <div class="mb-6">
                            <Label for="input-group-1" class="block mb-2">Guide</Label>
                            <div class="flex items-center space-x-2">
                                <Input id="status" bind:value={guideName} readonly
                                       class="input input-bordered input-primary" />
                                {#if tripDoc.guideRef}
                                    <a href={`../guides/${guideId}`} class="text-blue-500 hover:text-blue-700">View</a>
                                {/if}
                            </div>
                        </div>
                        <div class="row">
                            <div class="mb-6" style="float: left; width: 30%">
                                <Label for="input-group-1" class="block mb-2">Persons</Label>
                                <div class="flex items-center space-x-2">
                                    <Input id="status" bind:value={tripDoc.persons} readonly
                                           class="input input-bordered input-primary" />
                                </div>
                            </div>
                            <div class="mb-6" style="float: left; width: 30%; margin-left: 5%">
                                <Label for="input-group-1" class="block mb-2">Only Electric Vehicles</Label>
                                <div class="flex items-center space-x-2">
                                    <Input id="status" bind:value={tripDoc.onlyElectricVehicles} readonly
                                           class="input input-bordered input-primary" />
                                </div>
                            </div>
                            <div class="mb-6" style="float: right; width: 30%">
                                <Label for="input-group-1" class="block mb-2">Guide Language</Label>
                                <div class="flex items-center space-x-2">
                                    <Input id="status" bind:value={tripDoc.guideLang} readonly
                                           class="input input-bordered input-primary" />
                                </div>
                            </div>
                        </div>
                        <div class="mb-6">
                            <Label for="input-group-1" class="block mb-2">Tax Number</Label>
                            <div class="flex items-center space-x-2">
                                <Input id="status" bind:value={tripDoc.taxNumber} readonly
                                       class="input input-bordered input-primary" />
                            </div>
                        </div>
                    </div>
                    <div style="float: right; width: 40%">
                        {#if $tripEvents.length > 0}
                            <Timeline order="vertical">
                                {#each $tripEvents as event}
                                    <TimelineItem
                                            title={event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                                            date={event.creationDate.toDate().toLocaleString()}>
                                        <svelte:fragment slot="icon">
                                              <span class="flex absolute -start-3 justify-center items-center w-6 h-6 bg-primary-200 rounded-full ring-8 ring-white dark:ring-gray-900 dark:bg-primary-900">
                                                {#if event.action === "created"}
                                                  <CalendarWeekSolid class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                {:else if event.action === "canceled"}
                                                  <CloseCircleSolid class="w-4 h-4 text-red-600 dark:text-red-400" />
                                                {:else if event.action === "accepted"}
                                                  <CheckCircleSolid class="w-4 h-4 text-green-600 dark:text-green-400" />
                                                {:else if event.action === "started"}
                                                  <PlaySolid class="w-4 h-4 text-green-600 dark:text-green-400" />
                                                {:else if event.action === "finished"}
                                                  <FlagSolid class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                {/if}
                                              </span>
                                        </svelte:fragment>
                                        <p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">{eventReason(event.reason)}</p>
                                        <p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">{event.notes}</p>
                                    </TimelineItem>
                                {/each}
                            </Timeline>
                        {/if}
                    </div>
                </div>
                    <div class="mb-6">
                        {#if tripDoc.status==="booked" || tripDoc.status==="pending" }
                            <Button color="red"  on:click={() => (cancelConfirmation = true)}>Cancel Trip</Button>
                            <Modal title="Cancel Trip" bind:open={cancelConfirmation}>
                                <Label class="space-y-2">
                                    <Select class="mt-2" placeholder="Select a cancel reason..." items={cancelReasons} bind:value={selectedCancelReason} required/>
                                </Label>
                                <Label class="space-y-2">
                                    <span>Notes</span>
                                    <Textarea id="textarea-id" placeholder="" rows="4" name="message" bind:value={notes}/>
                                </Label>
                                <svelte:fragment slot="footer">
                                    <Button type="submit"
                                            on:click={() => cancelTrip(tripDoc.date, selectedCancelReason, notes)}
                                            disabled={!selectedCancelReason}>Yes</Button>
                                    <Button on:click={() => { cancelConfirmation = false }} color="alternative">No</Button>
                                </svelte:fragment>
                            </Modal>
                        {/if}
                        {#if tripDoc.status==="pending" }
                            <Button color="blue"  on:click={searchAvailableGuides} style="margin-left: 20px">Guides Available</Button>
                            <Modal title="Guides Available" bind:open={guidesAvailable}>

                            </Modal>
                        {/if}
                    </div>
                <hr class="double">
                {#if guideReviewDoc != null && tourReviewDoc != null }
                    <div class="row">
                        <div style="float: left; width: 45%">
                            <div class="mb-6">
                                <Label for="input-group-1" class="block mb-2">Guide Review</Label>
                                <Rating id="example-3" total={5} rating={guideReviewDoc.rating}>
                                    <p slot="text" class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">{guideReviewDoc.rating} out of 5</p>
                                </Rating>
                            </div>
                            <div class="mb-6">
                                <Label for="textarea-id" class="mb-2">Comment</Label>
                                <Textarea id="textarea-id" rows="4" bind:placeholder={guideReviewDoc.comment} />
                            </div>
                        </div>
                        <div style="float: right; width: 45%">
                            <div class="mb-6">
                                <Label for="input-group-1" class="block mb-2">Tour Review</Label>
                                <Rating id="example-3" total={5} rating={tourReviewDoc.rating}>
                                    <p slot="text" class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">{tourReviewDoc.rating} out of 5</p>
                                </Rating>
                            </div>
                            <div class="mb-6">
                                <Label for="textarea-id" class="mb-2">Comment</Label>
                                <Textarea id="textarea-id" rows="4" bind:placeholder={tourReviewDoc.comment}/>
                            </div>
                        </div>
                    </div>
                    <hr class="double">
                {/if}
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

    /* Clear floats after the columns */
    .row:after {
        content: "";
        display: table;
        clear: both;
    }
</style>

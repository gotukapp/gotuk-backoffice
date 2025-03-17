<script>
    import {
        Card,
        Spinner,
        Button,
        Label,
        Input,
        Accordion,
        AccordionItem,
        Alert,
        Modal,
        Badge,
        Rating
    } from 'flowbite-svelte';
    import { ArrowLeftOutline, CheckCircleSolid } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import {db, sendNotification} from '$lib'
    import {collection, doc, getDoc, orderBy, query, limit, getDocs, updateDoc} from "firebase/firestore";
    import { page } from "$app/stores";
    import { slide } from "svelte/transition";
    import { authUser } from '$lib/stores/authUser.js'

    let showAlert = $state(false);
    let alertMessage = $state('');
    let guide = $state(null);
    let documents = $state(null);
    let loading = $state(true);
    let error = $state(null);

    let validateAccountConfirmation = $state(false);
    let identificationNumberExpirationDate = $state("");
    let drivingLicenseExpirationDate = $state("");
    let insurancePersonalAccidentExpirationDate = $state("");

    async function approve(fieldName) {
        const documentsRef = collection(doc(db, "users", $page.params.id), "documents");
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref; // Use .ref to get the reference of the document

            // Update the specified field
            await updateDoc(docRef, { [fieldName]: "approved" });
            console.log(`Field "${fieldName}" updated to "approved".`);
        } else {
            console.log("No documents found to approve.");
        }
    }

    async function changeAccountStatus(currentState) {
        const documentRef = doc(db, "users", $page.params.id)
        await updateDoc(documentRef, { "accountValidated": !currentState })
        guide.accountValidated = !currentState
        const notificationTitle = guide.accountValidated ?  "Account validated" : "Account blocked"
        const notificationBody = guide.accountValidated ?  "Your account has been validated. Everything is ready for you to receive bookings." : "Your account has been blocked. Please check the app for invalid documents."
        await sendNotification(guide.firebaseToken, notificationTitle, notificationBody)
        alertMessage = guide.accountValidated ?  "Account successfully validated" : "Account successfully blocked"
        showAlert = true
        setTimeout(() => {
            showAlert = false;
        }, 2000);
    }

    onMount(async () => {
        try {
            const id = $page.params.id;
            const guideRef = doc(db, "users", id);
            const guideSnap = await getDoc(guideRef);

            const documentsRef = collection(doc(db, "users", id), "documents");
            const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
            const querySnapshot = await getDocs(q);

            if (guideSnap.exists()) {
                guide = guideSnap.data();
            } else {
                error = "Documento não encontrado!";
            }

            if (!querySnapshot.empty) {
                documents = querySnapshot.docs[0].data();

                if (documents.identificationNumberExpirationDate != null) {
                    identificationNumberExpirationDate = new Date(
                        documents.identificationNumberExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }

                if (documents.drivingLicenseExpirationDate != null) {
                    drivingLicenseExpirationDate = new Date(
                        documents.drivingLicenseExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }

                if (documents.insurancePersonalAccidentExpirationDate != null) {
                    insurancePersonalAccidentExpirationDate = new Date(
                        documents.insurancePersonalAccidentExpirationDate.seconds * 1000
                    ).toISOString().substring(0, 10);
                }
            }
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
        <p style="margin-top: 20px"><Spinner/> Loading Guide...</p>
    {:else if error}
        <p>{error}</p>
    {:else}
        {#if showAlert}
            <Alert color="green" dismissable transition={slide} style="margin-top: 10px">
                <svelte:fragment slot="icon">
                    <CheckCircleSolid class="w-5 h-5" />
                    <span class="sr-only">Check icon</span>
                </svelte:fragment>
                <span class="font-medium">{alertMessage}</span>
            </Alert>
        {/if}
        <Card size="xl" style="margin-top: 20px">
            <Badge border color="{guide.accountValidated ? 'green' :'red'}">{guide.accountValidated ? "Valid" : "Blocked"}</Badge>
            <div style="margin-top: 20px">
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Name</Label>
                    <Input id="name" bind:value={guide.name} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Email</Label>
                    <Input id="name" bind:value={guide.email} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Phone</Label>
                    <Input id="name" bind:value={guide.phone} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Languages</Label>
                    <Input id="name" value={guide.language.toString().toUpperCase()} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Rating</Label>
                    <Rating id="example-3" total={5} rating={guide.rating}>
                        <p slot="text" class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">{guide.rating} out of 5
                        </p>
                    </Rating>
                    <a href="/" class="text-sm font-medium text-gray-900 underline hover:no-underline dark:text-white"> 73 reviews </a>
                </div>
                {#if $authUser.isAdmin}
                    <div class="mb-6">
                        <Button pill color="light" style="margin-top: 10px" on:click={() => (validateAccountConfirmation = true)}>{guide.accountValidated ? "Block Account" : "Validate Account"}</Button>
                        <Modal title="{guide.accountValidated ? 'Block Account' : 'Validate Account'}" bind:open={validateAccountConfirmation} autoclose>
                            <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Are you sure you want to {guide.accountValidated ? "block" : "validate"} this account.</p>
                            <svelte:fragment slot="footer">
                                <Button on:click={() => changeAccountStatus(guide.accountValidated)}>Yes</Button>
                                <Button color="alternative">No</Button>
                            </svelte:fragment>
                        </Modal>
                    </div>
                {/if}
            </div>
        </Card>
        {#if documents != null}
            <Card size="xl" style="margin-top: 20px">
            <p><strong>Submit Date:</strong>{  (documents != null && documents.submitDate != null) ? new Date(documents.submitDate.seconds * 1000).toLocaleString() : '' }</p>
            <Accordion style="margin-top: 20px; margin-bottom: 20px">
                <AccordionItem>
                    <span slot="header">Documento de Identificação</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº CC/Passaporte</Label>
                        <Input id="name" bind:value={documents.identificationNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={identificationNumberExpirationDate} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Carta de condução</Label>
                        <Input id="name" bind:value={documents.drivingLicenseNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={drivingLicenseExpirationDate} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("identificationDocuments")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Formação</span>
                    <Button pill color="light" on:click={() => approve("training")}>Aprovar</Button>
                </AccordionItem>
                <AccordionItem>
                    <span slot="header">Apólice de Seguro de Acidentes Pessoais</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <Input id="name" bind:value={documents.insurancePersonalAccidentCompanyName} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <Input id="name" bind:value={documents.insurancePersonalAccidentPolicyNumber} readonly/>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <Input id="name" bind:value={insurancePersonalAccidentExpirationDate} readonly/>
                    </div>
                    <Button pill color="light" on:click={() => approve("personalAccidentInsurancePolicy")}>Aprovar</Button>
                </AccordionItem>
            </Accordion>
        </Card>
        {/if}
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

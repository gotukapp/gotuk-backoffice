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
    import {collection, doc, getDoc, orderBy, query, limit, getDocs, updateDoc, onSnapshot} from "firebase/firestore";
    import { page } from "$app/stores";
    import { slide } from "svelte/transition";
    import { authUser } from '$lib/stores/authUser.js'
    import {addDocumentationDate, formatDate, getAllFilesFromFolder} from "$lib/utils.js";
    import DocumentStatusBadge from "$lib/components/DocumentStatusBadge.svelte";
    import DocumentStatusIcons from "$lib/components/DocumentStatusIcons.svelte";
    import { getOrg } from '$lib/stores/organizations';

    let showAlert = $state(false);
    let alertMessage = $state('');
    let guide = $state(null);
    let documents = $state(null);
    let loading = $state(true);
    let error = $state(null);

    let validateAccountConfirmation = $state(false);

    let unsubscribePersonalDataDocuments;
    let personalData = $state(null);
    let personalDataFiles = $state([]);

    let unsubscribeWorkAccidentInsuranceDocuments;
    let workAccidentInsuranceData = $state(null);
    let workAccidentInsuranceFiles = $state([]);

    let unsubscribeCriminalRecordDocuments;
    let criminalRecordData = $state(null);
    let criminalRecordFiles = $state([]);

    async function approve(documentType) {
        const documentsRef = collection(doc(db, "users", $page.params.id), documentType);
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { status: "approved" });
            const data = querySnapshot.docs[0].data();

            if (documentType === "workAccidentInsurance" &&
                !workAccidentInsuranceData?.useOrganizationInsurance) {
                await addDocumentationDate("users", $page.params.id, docRef, data.expirationDate, documentType);
            }

            if (documentType === "personalData") {
                await addDocumentationDate("users", $page.params.id, docRef, data.identificationNumberExpirationDate, "identificationNumber");
                await addDocumentationDate("users", $page.params.id, docRef, data.drivingLicenseExpirationDate, "drivingLicense");
            }

            console.log(`Documents "${documentType}" updated to "approved".`);
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

    async function acceptAccount() {
        const documentRef = doc(db, "users", $page.params.id)
        await updateDoc(documentRef, {
            "accountAccepted": true,
        })
        guide.accountAccepted = true

        const notificationTitle = "Account accepted"
        const notificationBody = "Your account has been accepted by the company."
        await sendNotification(guide.firebaseToken, notificationTitle, notificationBody)
        alertMessage = "Account accepted"
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

            if (guideSnap.exists()) {
                guide = guideSnap.data();
                if (guide.organizationRef) {
                    guide.orgName = (await getOrg(guide.organizationRef)).name;
                }

                const queryPersonalData = query(collection(doc(db, "users", id), "personalData"), orderBy("submitDate", "desc"), limit(1));
                unsubscribePersonalDataDocuments = onSnapshot(queryPersonalData, async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        personalData = querySnapshot.docs[0].data();
                        personalDataFiles = await getAllFilesFromFolder(`uploads/users/${$page.params.id}/personalData/${querySnapshot.docs[0].id}`)
                    }
                })

                const queryWorkAccidentInsurance = query(collection(doc(db, "users", id), "workAccidentInsurance"), orderBy("submitDate", "desc"), limit(1));
                unsubscribeWorkAccidentInsuranceDocuments = onSnapshot(queryWorkAccidentInsurance, async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        workAccidentInsuranceData = querySnapshot.docs[0].data();
                        workAccidentInsuranceFiles = await getAllFilesFromFolder(`uploads/users/${$page.params.id}/workAccidentInsurance/${querySnapshot.docs[0].id}`)
                    }
                })

                const queryCriminalRecord = query(collection(doc(db, "users", id), "criminalRecord"), orderBy("submitDate", "desc"), limit(1));
                unsubscribeCriminalRecordDocuments = onSnapshot(queryCriminalRecord, async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        criminalRecordData = querySnapshot.docs[0].data();
                        criminalRecordFiles = await getAllFilesFromFolder(`uploads/users/${$page.params.id}/criminalRecord/${querySnapshot.docs[0].id}`)
                    }
                })


                return () => {
                    unsubscribePersonalDataDocuments();
                    unsubscribeWorkAccidentInsuranceDocuments();
                    unsubscribeCriminalRecordDocuments();
                };
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
            <Badge border color={guide.accountValidated ? 'green' :'red'}>{guide.accountValidated ? "Ok" : "Blocked"}</Badge>
            <div class="mt-3">
                <div class="row">
                    <div class="mb-4" style="float: left; width: 85%">
                        <Label for="input-group-1" class="block mb-2">Nome</Label>
                        <div class="flex items-center space-x-2">
                            <div id="insurance-company" class="readonly-input">{guide.name}</div>
                        </div>
                    </div>
                    <div class="mb-4" style="float: right; width: 10%; margin-left: 5%">
                        <div class="flex items-center space-x-2">
                            <div class="relative w-20 h-20 mr-5">
                                <a href={guide.profilePhoto ?? "/avatar.png"} target="_blank" rel="noopener noreferrer">
                                    <img src={guide.profilePhoto ?? "/avatar.png"} alt="Document" class="w-full h-full object-cover rounded-full" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Email</Label>
                    <Input id="name" bind:value={guide.email} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Contacto</Label>
                    <Input id="name" bind:value={guide.phone} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Idiomas Falados</Label>
                    <Input id="name" value={guide.language != null ? guide.language.toString().toUpperCase() : ''} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Empresa</Label>
                    <Input id="name" bind:value={guide.orgName} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Classificação</Label>
                    <Rating id="example-3" total={5} rating={guide.rating}>
                        <p slot="text" class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">{guide.rating} out of 5
                        </p>
                    </Rating>
                </div>
                {#if $authUser.isAdmin && guide.accountAccepted}
                    <div class="mb-6">
                        <Button pill color="light" style="margin-top: 10px" on:click={() => (validateAccountConfirmation = true)}>{guide.accountValidated ? "Block Account" : "Validate Account"}</Button>
                        <Modal title={guide.accountValidated ? 'Block Account' : 'Validate Account'} bind:open={validateAccountConfirmation} autoclose>
                            <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Are you sure you want to {guide.accountValidated ? "block" : "validate"} this account.</p>
                            <svelte:fragment slot="footer">
                                <Button on:click={() => changeAccountStatus(guide.accountValidated)}>Yes</Button>
                                <Button color="alternative">No</Button>
                            </svelte:fragment>
                        </Modal>
                    </div>
                {/if}
                {#if !$authUser.isAdmin  && !guide.accountAccepted}
                    <div class="mb-6">
                        <Button pill color="light" style="margin-top: 10px" on:click={() => (validateAccountConfirmation = true)}>{"Aceitar Conta"}</Button>
                        <Modal title="Aceitar Conta" bind:open={validateAccountConfirmation} autoclose>
                            <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Tem a certeza de que pretende aceitar esta conta?</p>
                            <svelte:fragment slot="footer">
                                <Button on:click={() => acceptAccount()}>Sim</Button>
                                <Button color="alternative">Não</Button>
                            </svelte:fragment>
                        </Modal>
                    </div>
                {/if}
            </div>
        </Card>
        <Card size="xl" style="margin-top: 20px">
        <p><strong>Submetido a:</strong>{  (documents != null && documents.submitDate != null) ? new Date(documents.submitDate.seconds * 1000).toLocaleString() : '' }</p>
        <Accordion style="margin-top: 20px; margin-bottom: 20px">
            <AccordionItem>
                {#if personalData?.status}
                    <DocumentStatusBadge document={personalData} />
                {/if}
                <span slot="header" class="flex items-center gap-2">
                    <DocumentStatusIcons status={personalData?.status} expirationDate={personalData?.identificationNumberExpirationDate}/>
                    Documento de Identificação
                </span>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Nº CC/Passaporte</Label>
                    <div id="insurance-company" class="readonly-input">{personalData?.identificationNumber}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                    <div id="insurance-company" class="readonly-input">{formatDate(personalData?.identificationNumberExpirationDate)}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Carta de condução</Label>
                    <div id="insurance-company" class="readonly-input">{personalData?.drivingLicenseNumber}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                    <div id="insurance-company" class="readonly-input">{formatDate(personalData?.drivingLicenseExpirationDate)}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                    {#if personalDataFiles.length > 0}
                        <div class="flex gap-2 mt-2">
                            {#each personalDataFiles as file}
                                <div class="relative w-20 h-20 mr-5">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                        <img src={file.url} alt="Document" class="w-full h-full object-cover rounded-md" />
                                    </a>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
                {#if $authUser.isAdmin}
                    <Button pill color="light" on:click={() => approve("personalData")}>Aprovar</Button>
                {/if}
            </AccordionItem>
            <AccordionItem>
                {#if workAccidentInsuranceData?.status}
                    <DocumentStatusBadge document={workAccidentInsuranceData} />
                {/if}
                <span slot="header" class="flex items-center gap-2">
                    <DocumentStatusIcons status={workAccidentInsuranceData?.status} expirationDate={workAccidentInsuranceData?.expirationDate}/>
                    Apólice de Seguro de Acidentes de Trabalho
                    </span>
                {#if workAccidentInsuranceData?.useOrganizationInsurance}
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2"> - Está incluído na apólice da empresa.</Label>
                    </div>
                {/if}
                {#if !workAccidentInsuranceData?.useOrganizationInsurance}
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{workAccidentInsuranceData?.name}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-company" class="readonly-input">{workAccidentInsuranceData?.number}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-company" class="readonly-input">{formatDate(workAccidentInsuranceData?.expirationDate)}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if workAccidentInsuranceFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each workAccidentInsuranceFiles as file}
                                    <div class="relative w-20 h-20 mr-5">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                            <img src={file.url} alt="Document" class="w-full h-full object-cover rounded-md" />
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
                {#if $authUser.isAdmin}
                    <Button pill color="light" on:click={() => approve("workAccidentInsurance")}>Aprovar</Button>
                {/if}
            </AccordionItem>
            <AccordionItem>
                {#if criminalRecordData?.status}
                    <DocumentStatusBadge document={criminalRecordData} />
                {/if}
                <span slot="header" class="flex items-center gap-2">
                    <DocumentStatusIcons status={criminalRecordData?.status} />
                    Registo Criminal
                    </span>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                    {#if criminalRecordFiles.length > 0}
                        <div class="flex gap-2 mt-2">
                            {#each criminalRecordFiles as file}
                                <div class="relative w-20 h-20 mr-5">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                        <img src={file.url} alt="Document" class="w-full h-full object-cover rounded-md" />
                                    </a>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
                {#if $authUser.isAdmin}
                    <Button pill color="light" on:click={() => approve("criminalRecord")}>Aprovar</Button>
                {/if}
            </AccordionItem>
        </Accordion>
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
    .readonly-input {
        display: block;
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        color: #333;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
    .row:after {
        content: "";
        display: table;
        clear: both;
    }
</style>

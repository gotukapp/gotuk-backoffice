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
        TableHead, TableBodyRow, Badge, Accordion, AccordionItem, Modal, Helper, Alert
    } from 'flowbite-svelte';
    import { ArrowLeftOutline, CheckCircleSolid, FilePdfSolid } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import {db} from '$lib'
    import {
        collection,
        doc,
        getDocs,
        limit,
        onSnapshot,
        orderBy,
        query, serverTimestamp,
        updateDoc,
        where,
        writeBatch
    } from "firebase/firestore";
    import { page } from "$app/stores";
    import { writable } from "svelte/store";
    import { authUser } from '$lib/stores/authUser.js'
    import {getAllFilesFromFolder, getStatusColor, formatDate, openFilePicker, uploadImages} from "$lib/utils.js";
    import {slide} from "svelte/transition";


    let validateAccountConfirmation = $state(false);
    let showAlert = $state(false);
    let alertMessage = $state('');

    let document = $state(null);

    let editingContacts = $state(false);
    let contactName = $state('');
    let address = $state('');
    let phone = $state('');
    let email = $state('');

    let activityCertificateFiles = $state([]);
    let activityCertificateData = $state(null);
    let editingActivityCertificate = $state(false);
    let fileActivityCertificateInput = $state(null)
    let selectedActivityCertificateFiles =  $state([])
    let localActivityCertificatePreviews = $state([])
    let unsubscribeActivityCertificateDocuments;

    let licenseRNAATFiles = $state([]);
    let licenseRNAATData = $state(null);
    let editingLicenseRNAAT = $state(false);
    let licenseRNAATNumber = $state('');
    let fileLicenseRNAATInput = $state(null)
    let selectedLicenseRNAATFiles =  $state([])
    let localLicenseRNAATPreviews = $state([])
    let unsubscribeLicenseRNAATDocuments;

    let workAccidentInsuranceData = $state(null);
    let workAccidentInsuranceFiles = $state([]);
    let unsubscribeWorkAccidentDocuments;
    let editingAccidentInsurance = $state(false)
    let insuranceWorkAccidentExpirationDate = $state("")
    let insuranceWorkAccidentCompanyName = $state("")
    let insuranceWorkAccidentPolicyNumber = $state("")
    let fileInput = $state(null)
    let selectedFiles =  $state([])
    let localPreviews = $state([])

    let civilLiabilityInsuranceData = $state(null);
    let civilLiabilityInsuranceFiles = $state([]);
    let unsubscribeCivilLiabilityDocuments;
    let editingCivilLiabilityInsurance = $state(false)
    let insuranceCivilLiabilityExpirationDate = $state("")
    let insuranceCivilLiabilityCompanyName = $state("")
    let insuranceCivilLiabilityPolicyNumber = $state("")
    let fileCivilLiabilityInsuranceInput = $state(null)
    let selectedCivilLiabilityInsuranceFiles =  $state([])
    let localCivilLiabilityInsurancePreviews = $state([])

    let uploadProgress = $state(0)
    let isUploading = $state(false)

    let loading = $state(true);
    let error = $state(null);
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

                    const documentsActivityCertificateRef = collection(doc(db, "organizations", id), "activityCertificate");
                    const queryActivityCertificateDocuments = query(documentsActivityCertificateRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeActivityCertificateDocuments = onSnapshot(queryActivityCertificateDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            activityCertificateData = querySnapshot.docs[0].data();
                            activityCertificateFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/activityCertificate/${querySnapshot.docs[0].id}`)
                        }
                    })

                    const documentsLicenseRNAATRef = collection(doc(db, "organizations", id), "licenseRNAAT");
                    const queryLicenseRNAATDocuments = query(documentsLicenseRNAATRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeLicenseRNAATDocuments = onSnapshot(queryLicenseRNAATDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            licenseRNAATData = querySnapshot.docs[0].data();
                            licenseRNAATFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/licenseRNAAT/${querySnapshot.docs[0].id}`)
                        }
                    })

                    const documentsRef = collection(doc(db, "organizations", id), "workAccidentInsurance");
                    const queryDocuments = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeWorkAccidentDocuments = onSnapshot(queryDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            workAccidentInsuranceData = querySnapshot.docs[0].data();
                            workAccidentInsuranceFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/workAccidentInsurance/${querySnapshot.docs[0].id}`)
                        }
                    })

                    const civilLiabilityDocumentsRef = collection(doc(db, "organizations", id), "civilLiabilityInsurance");
                    const civilLiabilityQueryDocuments = query(civilLiabilityDocumentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeCivilLiabilityDocuments = onSnapshot(civilLiabilityQueryDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            civilLiabilityInsuranceData = querySnapshot.docs[0].data();
                            civilLiabilityInsuranceFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/civilLiabilityInsurance/${querySnapshot.docs[0].id}`)
                        }
                    })

                } else {
                    error = "Documento não encontrado!";
                }
            });

            // Listen for live updates in tuks
            const qTuks = query(collection(db, "tuktuks"), where("organizationRef", "==", docRef), where("disabled", "==", false));
            const unsubscribeTuks = onSnapshot(qTuks, (querySnapshot) => {
                tuks.set(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
            });

            // Listen for live updates in users
            const qUsers = query(collection(db, "users"), where("organizationRef", "==", docRef)
                , where("guideMode", "==", true), where("disabled", "==", false));
            const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
                users.set(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
            });

            return () => {
                unsubscribeOrg();
                unsubscribeTuks();
                unsubscribeUsers();

                unsubscribeActivityCertificateDocuments();
                unsubscribeLicenseRNAATDocuments();
                unsubscribeWorkAccidentDocuments();
                unsubscribeCivilLiabilityDocuments();
            }
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });

    function removeImage(files, previews, index) {
        files.splice(index, 1)
        previews.splice(index, 1)
    }

    function selectFiles(event) {
        selectedFiles.push(...Array.from(event.target.files))
        localPreviews = selectedFiles.map(file => URL.createObjectURL(file))
    }

    function selectCivilLiabilityInsuranceFiles(event) {
        selectedCivilLiabilityInsuranceFiles.push(...Array.from(event.target.files))
        localCivilLiabilityInsurancePreviews = selectedCivilLiabilityInsuranceFiles.map(file => URL.createObjectURL(file))
    }

    function selectActivityCertificateFiles(event) {
        selectedActivityCertificateFiles.push(...Array.from(event.target.files))
        localActivityCertificatePreviews = selectedActivityCertificateFiles.map(file => URL.createObjectURL(file))
    }

    function selectLicenseRNAATFiles(event) {
        selectedLicenseRNAATFiles.push(...Array.from(event.target.files))
        localLicenseRNAATPreviews = selectedLicenseRNAATFiles.map(file => URL.createObjectURL(file))
    }

    async function submitContacts() {
        isUploading = true
        const docRef = doc(db, "organizations", $page.params.id)
        await updateDoc(docRef, {
            contactName: contactName,
            address: address,
            phone: phone,
            email: email
        })

        isUploading = false
        editingContacts = false;
    }

    async function submitActivityCertificate() {
        isUploading = true
        const batch = writeBatch(db);
        const docRef = doc(collection(doc(db, "organizations", $page.params.id), "activityCertificate"))
        await uploadImages(`uploads/organizations/${$page.params.id}/activityCertificate/${docRef.id}`, selectedActivityCertificateFiles, (progress) => { uploadProgress = progress; });
        batch.set(docRef, {
            status: 'pending',
            submitDate: serverTimestamp()
        });
        createMailDocument(batch, $page.params.id, document?.name, "Comprovativo de Atividade ou Certidão Permanente")
        await batch.commit();
        isUploading = false
        editingActivityCertificate = false;
    }

    function createMailDocument(batch, orgId, orgName, type) {
        const mailRef = doc(collection(db, "mail"));
        batch.set(mailRef, {
            to: ["suporte@gotuk.pt"],
            message: {
                subject: "Novos Documentos Submetidos para Verificação",
                html: `
                <p>Olá,</p>
                <p>A empresa <strong>${orgName}</strong> enviou novos documentos para verificação.</p>
                <p><strong>Tipo de Documentos:</strong> ${type}.</p>
                <p>Para aceder e verificar os documentos submetidos, clique no link abaixo:</p>
                <p><a href="http://backoffice.gotuk.pt/organizations/${orgId}" target="_blank">Verificar Documentos</a></p>
            `
            }
        });
    }

    async function submitLicenseRNAAT() {
        isUploading = true
        const batch = writeBatch(db);
        const docRef = doc(collection(doc(db, "organizations", $page.params.id), "licenseRNAAT"))
        await uploadImages(`uploads/organizations/${$page.params.id}/licenseRNAAT/${docRef.id}`, selectedLicenseRNAATFiles, (progress) => { uploadProgress = progress; });
        batch.set(docRef, {
            number: licenseRNAATNumber,
            status: 'pending',
            submitDate: serverTimestamp()
        });
        createMailDocument(batch, $page.params.id, document?.name, "Licença RNAAT")
        await batch.commit();
        isUploading = false
        editingLicenseRNAAT = false;
    }

    async function submitWorkAccidentInsurance() {
        await submit("workAccidentInsurance", insuranceWorkAccidentCompanyName, insuranceWorkAccidentPolicyNumber, insuranceWorkAccidentExpirationDate, selectedFiles)
        editingAccidentInsurance = false;
    }

    async function submitCivilLiabilityInsurance() {
        await submit("civilLiabilityInsurance", insuranceCivilLiabilityCompanyName, insuranceCivilLiabilityPolicyNumber, insuranceCivilLiabilityExpirationDate, selectedCivilLiabilityInsuranceFiles)
        editingCivilLiabilityInsurance = false;
    }

    async function submit(documentType, name, number, expirationDate, files) {
        isUploading = true
        const batch = writeBatch(db);
        const docRef = doc(collection(doc(db, "organizations", $page.params.id), documentType))
        await uploadImages(`uploads/organizations/${$page.params.id}/${documentType}/${docRef.id}`, files, (progress) => { uploadProgress = progress; });
        batch.set(docRef, {
            name: name,
            number: number,
            expirationDate: expirationDate ? new Date(expirationDate) : expirationDate,
            status: 'pending',
            submitDate: serverTimestamp()
        });
        createMailDocument(batch, $page.params.id, document?.name, documentType === "civilLiabilityInsurance" ? "Apólice de Seguro de Responsabilidade Civil" : "Apólice de Seguro de Acidentes de Trabalho")
        await batch.commit();
        isUploading = false
    }

    async function approve(documentType) {
        const documentsRef = collection(doc(db, "organizations", $page.params.id), documentType);
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { status: "approved" });
        } else {
            console.log("No documents found to approve.");
        }
    }

    function generateRandomCode() {
        return `${randomFourDigits()}-${randomFourDigits()}-${randomFourDigits()}`
    }

    function randomFourDigits() {
        return Math.floor(1000 + Math.random() * 9000) // Ensures a 4-digit number
    }

    async function changeAccountStatus(currentState) {
        const documentRef = doc(db, "organizations", $page.params.id)
        await updateDoc(documentRef,
            { "orgCode": generateRandomCode() },
            { "isValid": !currentState }
        )
        alertMessage = document.isValid ?  "Account successfully validated" : "Account successfully blocked"
        showAlert = true
        setTimeout(() => {
            showAlert = false;
        }, 2000);
    }

    function editContacts() {
        contactName = document?.contactName
        address = document?.address
        phone = document?.phone
        email = document?.email
        editingContacts = true
    }
</script>
<div class="w-full" style="margin: 20px">
    <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>

    {#if loading}
        <p style="margin-top: 20px"><Spinner/> Loading Organization...</p>
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
            <Badge border color={document?.isValid ? 'green' :'red'}>{document?.isValid ? "Ok" : "Blocked"}</Badge>
            <div class="mt-3">
                <div class="mb-4">
                    <Label for="input-group-1" class="block mb-2">Código</Label>
                    <div id="insurance-company" class="readonly-input">{document?.orgCode}</div>
                </div>
                <div class="row">
                    <div class="mb-4" style="float: left; width: 70%">
                        <Label for="input-group-1" class="block mb-2">Nome</Label>
                        <div class="flex items-center space-x-2">
                            <div id="insurance-company" class="readonly-input">{document?.name}</div>
                        </div>
                    </div>
                    <div class="mb-4" style="float: right; width: 20%; margin-left: 5%">
                        <Label for="input-group-1" class="block mb-2">NIF</Label>
                        <div class="flex items-center space-x-2">
                            <div id="insurance-company" class="readonly-input">{document?.vat}</div>
                        </div>
                    </div>
                </div>
                <section class="relative p-4 border border-gray-300 rounded-lg mt-4">
                    <h2 class="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-lg font-semibold">
                        Contactos
                    </h2>
                    <div class="mb-4 mt-4">
                        <Label for="input-group-1" class="block mb-2">Nome de Contacto</Label>
                        <div id="insurance-company" class="readonly-input">{document?.contactName}</div>
                    </div>
                    <div class="mb-4">
                        <Label for="input-group-1" class="block mb-2">Morada</Label>
                        <div id="insurance-company" class="readonly-input">{document?.address}</div>
                    </div>
                    <div class="row">
                        <div class="mb-4" style="float: left; width: 40%">
                            <Label for="input-group-1" class="block mb-2">Telefone</Label>
                            <div class="flex items-center space-x-2">
                                <div id="insurance-company" class="readonly-input">{document?.phone}</div>
                            </div>
                        </div>
                        <div class="mb-4" style="float: right; width: 40%; margin-left: 5%">
                            <Label for="input-group-1" class="block mb-2">Email</Label>
                            <div class="flex items-center space-x-2">
                                <div id="insurance-company" class="readonly-input">{document?.email}</div>
                            </div>
                        </div>
                    </div>
                    {#if !$authUser.isAdmin}
                        <hr class="mb-3" />
                        <div>
                            <Button pill color="light" on:click={editContacts}>Editar</Button>
                            <Modal title="Contactos" bind:open={editingContacts} autoclose={!isUploading}>
                                <div>
                                    <div class="mb-4">
                                        <Label for="input-group-1" class="block mb-2">Nome do Responsável</Label>
                                        <Input id="name" bind:value={contactName}/>
                                    </div>
                                    <div class="mb-4">
                                        <Label for="input-group-1" class="block mb-2">Morada</Label>
                                        <Input id="name" bind:value={address}/>
                                    </div>
                                    <div class="row">
                                        <div class="mb-4" style="float: left; width: 40%">
                                            <Label for="input-group-1" class="block mb-2">Telefone</Label>
                                            <div class="flex items-center space-x-2">
                                                <Input type="number" id="name" bind:value={phone} maxlength="12"/>
                                            </div>
                                        </div>
                                        <div class="mb-4" style="float: right; width: 40%; margin-left: 5%">
                                            <Label for="input-group-1" class="block mb-2">Email</Label>
                                            <div class="flex items-center space-x-2">
                                                <Input type="email" id="name" bind:value={email} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitContacts()}>{#if isUploading}<Spinner />{/if}Gravar</Button>
                                </svelte:fragment>
                            </Modal>
                        </div>
                    {/if}
                </section>
                {#if $authUser.isAdmin}
                    <div class="mb-6">
                        <Button pill color="light" style="margin-top: 10px" on:click={() => (validateAccountConfirmation = true)}>{document?.isValid ? "Block Account" : "Validate Account"}</Button>
                        <Modal title={document?.isValid ? 'Block Account' : 'Validate Account'} bind:open={validateAccountConfirmation} autoclose>
                            <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Are you sure you want to {document?.isValid ? "block" : "validate"} this account.</p>
                            <svelte:fragment slot="footer">
                                <Button on:click={() => changeAccountStatus(document?.isValid)}>Yes</Button>
                                <Button color="alternative">No</Button>
                            </svelte:fragment>
                        </Modal>
                    </div>
                {/if}
            </div>
        </Card>
        <Card size="xl" style="margin-top: 20px">
            <Accordion style="margin-top: 20px; margin-bottom: 20px">
                <AccordionItem>
                    {#if activityCertificateData?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(activityCertificateData?.status)}>{activityCertificateData?.status.toUpperCase()}</Badge>
                        </div>
                    {/if}
                    <span slot="header" class="flex items-center gap-2">
                        {#if activityCertificateData?.status === "approved"}
                            <CheckCircleSolid color="green" />
                        {/if}
                        Comprovativo de Actividade ou Certidão Permanente
                    </span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if activityCertificateFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each activityCertificateFiles as file}
                                    <div class="relative w-20 h-20 mr-5">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                            {#if file.type.startsWith('image/')}
                                                <img src={file.url} alt="Document Thumbnail" class="w-full h-full object-cover rounded-md" />
                                            {:else if file.type === 'application/pdf'}
                                                <FilePdfSolid class="w-10 h-10"/>
                                            {:else if file.type.includes('word')}
                                                <img src="/icons/doc-icon.png" alt="Word Document" class="w-full h-full object-cover rounded-md" />
                                            {:else}
                                                <img src="/icons/file-icon.png" alt="Generic File" class="w-full h-full object-cover rounded-md" />
                                            {/if}
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="blue" on:click={() => approve("activityCertificate")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingActivityCertificate = true}>Novo</Button>
                            <Modal title="Comprovativo de Actividade ou Certidão Permanente" bind:open={editingActivityCertificate} autoclose={!isUploading}>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                    <input type="file" accept="image/*" bind:this={fileActivityCertificateInput} multiple onchange={selectActivityCertificateFiles} style="display: none" />
                                    {#if localActivityCertificatePreviews.length > 0}
                                        <div class="flex gap-2 mt-2">
                                            {#each localActivityCertificatePreviews as preview, index}
                                                <div class="relative w-20 h-20 previewImage">
                                                    <!-- Image Preview -->
                                                    <img src={preview} alt="Document" class="w-full h-full object-cover rounded-md" />
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(selectedActivityCertificateFiles, localActivityCertificatePreviews, index)}} >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <Button color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileActivityCertificateInput); }}>
                                    Adicionar
                                </Button>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitActivityCertificate()}>Submeter</Button>
                                    {#if isUploading}
                                        <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                    {/if}
                                </svelte:fragment>
                            </Modal>
                        </div>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    {#if licenseRNAATData?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(licenseRNAATData?.status)}>{licenseRNAATData?.status.toUpperCase()}</Badge>
                        </div>
                    {/if}
                    <span slot="header" class="flex items-center gap-2">
                        {#if licenseRNAATData?.status === "approved"}
                            <CheckCircleSolid color="green" />
                        {/if}
                        Licença RNAAT
                    </span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Registo</Label>
                        <div id="insurance-company" class="readonly-input">{licenseRNAATData?.number}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if licenseRNAATFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each licenseRNAATFiles as file}
                                    <div class="relative w-20 h-20 mr-5">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                            {#if file.type.startsWith('image/')}
                                                <img src={file.url} alt="Document Thumbnail" class="w-full h-full object-cover rounded-md" />
                                            {:else if file.type === 'application/pdf'}
                                                <FilePdfSolid class="w-10 h-10"/>
                                            {:else if file.type.includes('word')}
                                                <img src="/icons/doc-icon.png" alt="Word Document" class="w-full h-full object-cover rounded-md" />
                                            {:else}
                                                <img src="/icons/file-icon.png" alt="Generic File" class="w-full h-full object-cover rounded-md" />
                                            {/if}
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("licenseRNAAT")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingLicenseRNAAT = true}>Novo</Button>
                            <Modal title="Licença RNAAT" bind:open={editingLicenseRNAAT} autoclose={!isUploading}>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Nº Registo</Label>
                                    <Input id="companyName" bind:value={licenseRNAATNumber}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                    <input type="file" accept="image/*" bind:this={fileLicenseRNAATInput} multiple onchange={selectLicenseRNAATFiles} style="display: none" />
                                    {#if localLicenseRNAATPreviews.length > 0}
                                        <div class="flex gap-2 mt-2">
                                            {#each localLicenseRNAATPreviews as preview, index}
                                                <div class="relative w-20 h-20 previewImage">
                                                    <!-- Image Preview -->
                                                    <img src={preview} alt="Document" class="w-full h-full object-cover rounded-md" />
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(selectedLicenseRNAATFiles, localLicenseRNAATPreviews, index)}} >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <Button color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileLicenseRNAATInput); }}>
                                    Adicionar
                                </Button>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitLicenseRNAAT()}>Submeter</Button>
                                    {#if isUploading}
                                        <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                    {/if}
                                </svelte:fragment>
                            </Modal>
                        </div>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    {#if civilLiabilityInsuranceData?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(civilLiabilityInsuranceData?.status)}>{civilLiabilityInsuranceData?.status.toUpperCase()}</Badge>
                        </div>
                    {/if}
                    <span slot="header" class="flex items-center gap-2">
                        {#if civilLiabilityInsuranceData?.status === "approved"}
                            <CheckCircleSolid color="green" />
                        {/if}
                        Apólice de Seguro de Responsabilidade Civil
                    </span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{civilLiabilityInsuranceData?.name}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-company" class="readonly-input">{civilLiabilityInsuranceData?.number}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-company" class="readonly-input">{formatDate(civilLiabilityInsuranceData?.expirationDate)}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if civilLiabilityInsuranceFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each civilLiabilityInsuranceFiles as file}
                                    <div class="relative w-20 h-20 mr-5">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                            {#if file.type.startsWith('image/')}
                                                <img src={file.url} alt="Document Thumbnail" class="w-full h-full object-cover rounded-md" />
                                            {:else if file.type === 'application/pdf'}
                                                <FilePdfSolid class="w-10 h-10"/>
                                            {:else if file.type.includes('word')}
                                                <img src="/icons/doc-icon.png" alt="Word Document" class="w-full h-full object-cover rounded-md" />
                                            {:else}
                                                <img src="/icons/file-icon.png" alt="Generic File" class="w-full h-full object-cover rounded-md" />
                                            {/if}
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("civilLiabilityInsurance")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingCivilLiabilityInsurance = true}>Novo</Button>
                            <Modal title="Apólice de Seguro de Responsabilidade Civil" bind:open={editingCivilLiabilityInsurance} autoclose={!isUploading}>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                                    <Input id="companyName" bind:value={insuranceCivilLiabilityCompanyName}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                                    <Input id="policyNumber" bind:value={insuranceCivilLiabilityPolicyNumber}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                                    <Input id="expirationDate" type="date" bind:value={insuranceCivilLiabilityExpirationDate}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Condições da Apolice</span></Helper>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Recibo de Pagamento</span></Helper>
                                    <input type="file" accept="image/*" bind:this={fileCivilLiabilityInsuranceInput} multiple onchange={selectCivilLiabilityInsuranceFiles} style="display: none" />
                                    {#if localCivilLiabilityInsurancePreviews.length > 0}
                                        <div class="flex gap-2 mt-2">
                                            {#each localCivilLiabilityInsurancePreviews as preview, index}
                                                <div class="relative w-20 h-20 previewImage">
                                                    <!-- Image Preview -->
                                                    <img src={preview} alt="Document" class="w-full h-full object-cover rounded-md" />
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(selectedCivilLiabilityInsuranceFiles, localCivilLiabilityInsurancePreviews, index)}} >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <Button color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileCivilLiabilityInsuranceInput); }}>
                                    Adicionar
                                </Button>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitCivilLiabilityInsurance()}>Submeter</Button>
                                    {#if isUploading}
                                        <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                    {/if}
                                </svelte:fragment>
                            </Modal>
                        </div>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    <span slot="header" class="flex items-center gap-2">
                        {#if workAccidentInsuranceData?.status === "approved"}
                            <CheckCircleSolid color="green" />
                        {/if}
                        Apólice de Seguro de Acidentes de Trabalho
                    </span>
                    {#if workAccidentInsuranceData?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(workAccidentInsuranceData?.status)}>{workAccidentInsuranceData?.status.toUpperCase()}</Badge>
                        </div>
                    {/if}
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
                                            {#if file.type.startsWith('image/')}
                                                <img src={file.url} alt="Document Thumbnail" class="w-full h-full object-cover rounded-md" />
                                            {:else if file.type === 'application/pdf'}
                                                <FilePdfSolid class="w-10 h-10"/>
                                            {:else if file.type.includes('word')}
                                                <img src="/icons/doc-icon.png" alt="Word Document" class="w-full h-full object-cover rounded-md" />
                                            {:else}
                                                <img src="/icons/file-icon.png" alt="Generic File" class="w-full h-full object-cover rounded-md" />
                                            {/if}
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("workAccidentInsurance")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingAccidentInsurance = true}>Novo</Button>
                            <Modal title="Apólice de Seguro de Acidentes de Trabalho" bind:open={editingAccidentInsurance} autoclose={!isUploading}>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                                    <Input id="companyName" bind:value={insuranceWorkAccidentCompanyName}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                                    <Input id="policyNumber" bind:value={insuranceWorkAccidentPolicyNumber}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                                    <Input id="expirationDate" type="date" bind:value={insuranceWorkAccidentExpirationDate}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Condições da Apolice</span></Helper>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Recibo de Pagamento</span></Helper>
                                    <input type="file" accept="image/*" bind:this={fileInput} multiple onchange={selectFiles} style="display: none" />
                                    {#if localPreviews.length > 0}
                                        <div class="flex gap-2 mt-2">
                                            {#each localPreviews as preview, index}
                                                <div class="relative w-20 h-20 previewImage">
                                                    <!-- Image Preview -->
                                                    <img alt="Document" class="w-full h-full object-cover rounded-md" src={preview} />
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(selectedFiles, localPreviews, index)}} >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <Button color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileInput); }}>
                                    Adicionar
                                </Button>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitWorkAccidentInsurance()}>Submeter</Button>
                                    {#if isUploading}
                                        <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                    {/if}
                                </svelte:fragment>
                            </Modal>
                        </div>
                    {/if}
                </AccordionItem>
            </Accordion>
        </Card>
        {#if $authUser.isAdmin}
            <Card size="xl" style="margin-top: 20px">
                <Table >
                    <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                        Tuks
                    </caption>
                    <TableHead>
                        <TableHeadCell>License Plate</TableHeadCell>
                        <TableHeadCell>Seats</TableHeadCell>
                        <TableHeadCell>Electric</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
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
                                <TableBodyCell>{tuk.isValid ? "Ok" : "Blocked"}</TableBodyCell>
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

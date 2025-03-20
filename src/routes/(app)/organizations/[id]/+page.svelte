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
        TableHead, TableBodyRow, Badge, Accordion, AccordionItem, Modal, Helper
    } from 'flowbite-svelte';
    import { ArrowLeftOutline } from 'flowbite-svelte-icons';
    import { onMount } from "svelte";
    import { db } from '$lib'
    import {
        collection,
        doc,
        getDocs,
        limit,
        onSnapshot,
        orderBy,
        query, serverTimestamp,
        setDoc,
        updateDoc,
        where
    } from "firebase/firestore";
    import { page } from "$app/stores";
    import { writable } from "svelte/store";
    import { authUser } from '$lib/stores/authUser.js'
    import {getAllFilesFromFolder, getStatusColor, formatDate, openFilePicker, uploadImages} from "$lib/utils.js";


    let document = $state(null);

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

    let personalInsuranceData = $state(null);
    let personalInsuranceFiles = $state([]);
    let unsubscribePersonalDocuments;
    let editingPersonalInsurance = $state(false)
    let insurancePersonalExpirationDate = $state("")
    let insurancePersonalCompanyName = $state("")
    let insurancePersonalPolicyNumber = $state("")
    let filePersonalInsuranceInput = $state(null)
    let selectedPersonalInsuranceFiles =  $state([])
    let localPersonalInsurancePreviews = $state([])

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

                    const personalInsuranceDocumentsRef = collection(doc(db, "organizations", id), "personalAccidentInsurance");
                    const personalInsuranceQueryDocuments = query(personalInsuranceDocumentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribePersonalDocuments = onSnapshot(personalInsuranceQueryDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            personalInsuranceData = querySnapshot.docs[0].data();
                            personalInsuranceFiles = await getAllFilesFromFolder(`uploads/organizations/${$page.params.id}/personalAccidentInsurance/${querySnapshot.docs[0].id}`)
                        }
                    })

                } else {
                    error = "Documento não encontrado!";
                }
            });

            if ($authUser.isAdmin) {
                // Listen for live updates in tuks
                const qTuks = query(collection(db, "tuktuks"), where("organizationRef", "==", docRef), where("disabled", "==", false));
                const unsubscribeTuks = onSnapshot(qTuks, (querySnapshot) => {
                    tuks.set(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
                });

                // Listen for live updates in users
                const qUsers = query(collection(db, "users"), where("organizationRef", "==", docRef)
                    , where("guideMode", "==", true), where("disabled", "==", false));
                console.log("Querying for tuktuks with organizationRef:", docRef.path);
                const unsubscribeUsers = onSnapshot(qUsers, (querySnapshot) => {
                    console.log("Users found:", querySnapshot.docs.length);
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
                    unsubscribePersonalDocuments();
                };
            } else {
                return () => {
                    unsubscribeOrg();
                    unsubscribeActivityCertificateDocuments();
                    unsubscribeLicenseRNAATDocuments();
                    unsubscribeWorkAccidentDocuments();
                    unsubscribeCivilLiabilityDocuments();
                    unsubscribePersonalDocuments();
                };
            }
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });

    function removeImage(index) {
        selectedFiles.splice(index, 1)
        localPreviews.splice(index, 1)
    }

    function selectFiles(event) {
        selectedFiles.push(...Array.from(event.target.files))
        localPreviews = selectedFiles.map(file => URL.createObjectURL(file))
    }

    function removeCivilLiabilityInsuranceImage(index) {
        selectedCivilLiabilityInsuranceFiles.splice(index, 1)
        localCivilLiabilityInsurancePreviews.splice(index, 1)
    }

    function selectCivilLiabilityInsuranceFiles(event) {
        selectedCivilLiabilityInsuranceFiles.push(...Array.from(event.target.files))
        localCivilLiabilityInsurancePreviews = selectedCivilLiabilityInsuranceFiles.map(file => URL.createObjectURL(file))
    }

    function removePersonalInsuranceImage(index) {
        selectedPersonalInsuranceFiles.splice(index, 1)
        localPersonalInsurancePreviews.splice(index, 1)
    }

    function selectPersonalInsuranceFiles(event) {
        selectedPersonalInsuranceFiles.push(...Array.from(event.target.files))
        localPersonalInsurancePreviews = selectedPersonalInsuranceFiles.map(file => URL.createObjectURL(file))
    }

    function removeActivityCertificateImage(index) {
        selectedActivityCertificateFiles.splice(index, 1)
        localActivityCertificatePreviews.splice(index, 1)
    }

    function selectActivityCertificateFiles(event) {
        selectedActivityCertificateFiles.push(...Array.from(event.target.files))
        localActivityCertificatePreviews = selectedActivityCertificateFiles.map(file => URL.createObjectURL(file))
    }

    async function submitActivityCertificate() {
        isUploading = true
        const docRef = doc(collection(doc(db, "organizations", $page.params.id), "activityCertificate"))
        await uploadImages(`uploads/organizations/${$page.params.id}/activityCertificate/${docRef.id}`, selectedActivityCertificateFiles, uploadProgress);
        await setDoc(docRef, {
            status: 'pending',
            submitDate: serverTimestamp()
        });

        isUploading = false
        editingActivityCertificate = false;
    }

    function removeLicenseRNAATImage(index) {
        selectedLicenseRNAATFiles.splice(index, 1)
        localLicenseRNAATPreviews.splice(index, 1)
    }

    function selectLicenseRNAATFiles(event) {
        selectedLicenseRNAATFiles.push(...Array.from(event.target.files))
        localLicenseRNAATPreviews = selectedLicenseRNAATFiles.map(file => URL.createObjectURL(file))
    }

    async function submitLicenseRNAAT() {
        isUploading = true
        const docRef = doc(collection(doc(db, "organizations", $page.params.id), "licenseRNAAT"))
        await uploadImages(`uploads/organizations/${$page.params.id}/licenseRNAAT/${docRef.id}`, selectedLicenseRNAATFiles, uploadProgress);
        await setDoc(docRef, {
            number: licenseRNAATNumber,
            status: 'pending',
            submitDate: serverTimestamp()
        });

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

    async function submitPersonalInsurance() {
        await submit("personalAccidentInsurance", insurancePersonalCompanyName, insurancePersonalPolicyNumber, insurancePersonalExpirationDate, selectedPersonalInsuranceFiles)
        editingPersonalInsurance = false;
    }

    async function submit(documentType, name, number, expirationDate, files) {
        isUploading = true
        const docRef = doc(collection(doc(db, "organizations", $page.params.id), documentType))
        await uploadImages(`uploads/organizations/${$page.params.id}/${documentType}/${docRef.id}`, files, uploadProgress);
        await setDoc(docRef, {
            name: name,
            number: number,
            expirationDate: new Date(expirationDate),
            status: 'pending',
            submitDate: serverTimestamp()
        });

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
                    <Label for="input-group-1" class="block mb-2">Code</Label>
                    <div id="insurance-company" class="readonly-input">{document?.orgCode}</div>
                </div>
                <div class="row">
                    <div class="mb-6" style="float: left; width: 70%">
                        <Label for="input-group-1" class="block mb-2">Name</Label>
                        <div class="flex items-center space-x-2">
                            <div id="insurance-company" class="readonly-input">{document?.name}</div>
                        </div>
                    </div>
                    <div class="mb-6" style="float: right; width: 20%; margin-left: 5%">
                        <Label for="input-group-1" class="block mb-2">VAT</Label>
                        <div class="flex items-center space-x-2">
                            <div id="insurance-company" class="readonly-input">{document?.vat}</div>
                        </div>
                    </div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Address</Label>
                    <div id="insurance-company" class="readonly-input">{document?.address}</div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Contact Name</Label>
                    <div id="insurance-company" class="readonly-input">{document?.contactName}</div>
                </div>
                <div class="row">
                    <div class="mb-6" style="float: left; width: 40%">
                        <Label for="input-group-1" class="block mb-2">Phone</Label>
                        <div class="flex items-center space-x-2">
                            <div id="insurance-company" class="readonly-input">{document?.phone}</div>
                        </div>
                    </div>
                    <div class="mb-6" style="float: right; width: 40%; margin-left: 5%">
                        <Label for="input-group-1" class="block mb-2">Email</Label>
                        <div class="flex items-center space-x-2">
                            <div id="insurance-company" class="readonly-input">{document?.email}</div>
                        </div>
                    </div>
                </div>
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
                    <span slot="header">Comprovativo de Actividade ou Certidão Permanente</span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if activityCertificateFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each activityCertificateFiles as file}
                                    <div class="relative w-20 h-20 mr-5">
                                        <a href={file} target="_blank" rel="noopener noreferrer">
                                            <img src={file} alt="Document" class="w-full h-full object-cover rounded-md" />
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
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeActivityCertificateImage(index)}} >
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
                    <span slot="header">Licença RNAAT</span>
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
                                        <a href={file} target="_blank" rel="noopener noreferrer">
                                            <img src={file} alt="Document" class="w-full h-full object-cover rounded-md" />
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
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeLicenseRNAATImage(index)}} >
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
                    <span slot="header">Apólice de Seguro de Responsabilidade Civil</span>
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
                                        <a href={file} target="_blank" rel="noopener noreferrer">
                                            <img src={file} alt="Document" class="w-full h-full object-cover rounded-md" />
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("submitCivilLiabilityInsurance")}>Aprovar</Button>
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
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeCivilLiabilityInsuranceImage(index)}} >
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
                    <span slot="header">
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
                                        <a href={file} target="_blank" rel="noopener noreferrer">
                                            <img src={file} alt="Document" class="w-full h-full object-cover rounded-md" />
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
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(index)}} >
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
                <AccordionItem>
                    <span slot="header">Apólice de Seguro de Acidentes Pessoais</span>
                    {#if personalInsuranceData?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(personalInsuranceData?.status)}>{personalInsuranceData?.status.toUpperCase()}</Badge>
                        </div>
                    {/if}
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{personalInsuranceData?.name}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-company" class="readonly-input">{personalInsuranceData?.number}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-company" class="readonly-input">{formatDate(personalInsuranceData?.expirationDate)}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if personalInsuranceFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each personalInsuranceFiles as file}
                                    <div class="relative w-20 h-20 mr-5">
                                        <a href={file} target="_blank" rel="noopener noreferrer">
                                            <img src={file} alt="Document" class="w-full h-full object-cover rounded-md" />
                                        </a>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    {#if $authUser.isAdmin}
                        <Button pill color="light" on:click={() => approve("personalAccidentInsurance")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingPersonalInsurance = true}>Novo</Button>
                            <Modal title="Apólice de Seguro de Acidentes de Trabalho" bind:open={editingPersonalInsurance} autoclose={!isUploading}>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                                    <Input id="companyName" bind:value={insurancePersonalCompanyName}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                                    <Input id="policyNumber" bind:value={insurancePersonalPolicyNumber}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                                    <Input id="expirationDate" type="date" bind:value={insurancePersonalExpirationDate}/>
                                </div>
                                <div class="mb-6">
                                    <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Condições da Apolice</span></Helper>
                                    <Helper class='ml-3 mt-2' color='red'><span class="font-medium">- Recibo de Pagamento</span></Helper>
                                    <input type="file" accept="image/*" bind:this={filePersonalInsuranceInput} multiple onchange={selectPersonalInsuranceFiles} style="display: none" />
                                    {#if localPersonalInsurancePreviews.length > 0}
                                        <div class="flex gap-2 mt-2">
                                            {#each localPersonalInsurancePreviews as preview, index}
                                                <div class="relative w-20 h-20 previewImage">
                                                    <!-- Image Preview -->
                                                    <img alt="Document" class="w-full h-full object-cover rounded-md" src={preview} />
                                                    <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removePersonalInsuranceImage(index)}} >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                                <Button color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(filePersonalInsuranceInput); }}>
                                    Adicionar
                                </Button>
                                <svelte:fragment slot="footer">
                                    <Button on:click={() => submitPersonalInsurance()}>Submeter</Button>
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

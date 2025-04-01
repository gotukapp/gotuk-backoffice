<script>
    import {
        Button,
        Card,
        Input,
        Label,
        Modal,
        Spinner,
        Badge,
        Helper,
        AccordionItem,
        Accordion,
        Alert
    } from 'flowbite-svelte';
    import {ArrowLeftOutline, CheckCircleSolid, CloseCircleSolid, ClockSolid, FilePdfSolid} from 'flowbite-svelte-icons';
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {getAllFilesFromFolder, getStatusColor, formatDate, openFilePicker, uploadImages} from '$lib/utils.js'
    import {
        collection,
        doc,
        getDocs,
        limit, onSnapshot,
        orderBy,
        query,
        serverTimestamp,
        setDoc,
        updateDoc
    } from "firebase/firestore";
    import {page} from "$app/stores";
    import {goto} from "$app/navigation";
    import {authUser} from '$lib/stores/authUser.js'
    import {slide} from "svelte/transition";

    let validateAccountConfirmation = $state(false);
    let showAlert = $state(false);
    let alertMessage = $state('');

    let editing = $state(false)
    let tuktukDoc = $state(null)
    let loading = $state(true)
    let error = $state(null)
    let insuranceInfo = $state(null)
    let vehicleInsuranceExpirationDate = $state("")
    let vehicleInsuranceCompanyName = $state("")
    let vehicleInsurancePolicyNumber = $state("")
    let insuranceInfoFiles = $state([])

    let vehicleDocument = $state(null)
    let vehicleInfoFiles = $state([])
    let fileInput = $state(null)
    let fileVehicleInfoInput = $state(null)
    let selectedFiles =  $state([])
    let localPreviews = $state([])
    let selectedVehicleInfoFiles =  $state([])
    let localVehicleInfoPreviews = $state([])
    let uploadProgress = $state(0)
    let isUploading = $state(false)
    let unsubscribeInsuranceDoc;
    let unsubscribeVehicleInfoDoc;

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


    onMount(async () => {
        try {
            const id = $page.params.id;
            const docRef = doc(db, "tuktuks", id);

            const unsubscribeTuk = onSnapshot(docRef, async (docSnap) => {
                if (docSnap.exists()) {
                    tuktukDoc = docSnap.data();

                    if (!$authUser.isAdmin && $authUser.user.organizationRef === tuktukDoc.organizationRef) {
                        await goto('/tuks')
                    }

                    const vehicleInsuranceDocRef = collection(doc(db, "tuktuks", id), "vehicleInsurance");
                    const queryVehicleInsurance = query(vehicleInsuranceDocRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeInsuranceDoc = onSnapshot(queryVehicleInsurance, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            insuranceInfo = querySnapshot.docs[0].data();
                            insuranceInfoFiles = await getAllFilesFromFolder(`uploads/tuktuks/${$page.params.id}/vehicleInsurance/${querySnapshot.docs[0].id}`)
                        }
                    })

                    const documentsRef = collection(doc(db, "tuktuks", id), "vehicleDocument");
                    const queryVehicleDocument = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribeVehicleInfoDoc = onSnapshot(queryVehicleDocument, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            vehicleDocument = querySnapshot.docs[0].data();
                            vehicleInfoFiles = await getAllFilesFromFolder(`uploads/tuktuks/${$page.params.id}/vehicleDocument/${querySnapshot.docs[0].id}`)
                        }
                    })

                    const personalInsuranceDocumentsRef = collection(doc(db, "tuktuks", id), "personalAccidentInsurance");
                    const personalInsuranceQueryDocuments = query(personalInsuranceDocumentsRef, orderBy("submitDate", "desc"), limit(1));
                    unsubscribePersonalDocuments = onSnapshot(personalInsuranceQueryDocuments, async (querySnapshot) => {
                        if (!querySnapshot.empty) {
                            personalInsuranceData = querySnapshot.docs[0].data();
                            personalInsuranceFiles = await getAllFilesFromFolder(`uploads/tuktuks/${$page.params.id}/personalAccidentInsurance/${querySnapshot.docs[0].id}`)
                        }
                    })

                } else {
                    error = "Documento não encontrado!";
                }
            })

            return () => {
                unsubscribeTuk();
                if (unsubscribeInsuranceDoc) unsubscribeInsuranceDoc();
                if (unsubscribeVehicleInfoDoc) unsubscribeVehicleInfoDoc();
                if (unsubscribePersonalDocuments) unsubscribePersonalDocuments();
            };
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });

    async function submitPersonalInsurance() {
        await submit("personalAccidentInsurance", insurancePersonalCompanyName, insurancePersonalPolicyNumber, insurancePersonalExpirationDate, selectedPersonalInsuranceFiles)
        editingPersonalInsurance = false;
    }

    async function submitVehicleInsurance() {
        await submit("vehicleInsurance", vehicleInsuranceCompanyName, vehicleInsurancePolicyNumber, vehicleInsuranceExpirationDate, selectedFiles)
        editingPersonalInsurance = false;
    }

    async function submitVehicleData() {
        isUploading = true
        const docRef = doc(collection(doc(db, "tuktuks", $page.params.id), "vehicleDocument"))
        await uploadImages(`uploads/tuktuks/${$page.params.id}/vehicleDocument/${docRef.id}`, selectedVehicleInfoFiles, (progress) => { uploadProgress = progress; });
        localPreviews.length = 0
        selectedFiles.length = 0
        await setDoc(docRef, {
            status: 'pending',
            submitDate: serverTimestamp()
        });
        isUploading = false
        editing = false;
    }

    async function submit(documentType, name, number, expirationDate, files) {
        isUploading = true
        const docRef = doc(collection(doc(db, "tuktuks", $page.params.id), documentType))
        await uploadImages(`uploads/tuktuks/${$page.params.id}/${documentType}/${docRef.id}`, files, (progress) => { uploadProgress = progress; });
        localPreviews.length = 0
        selectedFiles.length = 0
        await setDoc(docRef, {
            name: name,
            number: number,
            expirationDate: expirationDate ? new Date(expirationDate) : expirationDate,
            status: 'pending',
            submitDate: serverTimestamp()
        });

        isUploading = false
        editing = false;
    }

    function removeImage(index) {
        selectedFiles.splice(index, 1)
        localPreviews.splice(index, 1)
    }

    function selectFiles(event) {
        selectedFiles.push(...Array.from(event.target.files))
        localPreviews = selectedFiles.map(file => URL.createObjectURL(file))
    }

    function removeVehicleInfoImage(index) {
        selectedVehicleInfoFiles.splice(index, 1)
        localVehicleInfoPreviews.splice(index, 1)
    }

    function selectVehicleInfoFiles(event) {
        selectedVehicleInfoFiles.push(...Array.from(event.target.files))
        localVehicleInfoPreviews = selectedVehicleInfoFiles.map(file => URL.createObjectURL(file))
    }

    function removePersonalInsuranceImage(index) {
        selectedPersonalInsuranceFiles.splice(index, 1)
        localPersonalInsurancePreviews.splice(index, 1)
    }

    function selectPersonalInsuranceFiles(event) {
        selectedPersonalInsuranceFiles.push(...Array.from(event.target.files))
        localPersonalInsurancePreviews = selectedPersonalInsuranceFiles.map(file => URL.createObjectURL(file))
    }

    async function approve(fieldName) {
        const documentsRef = collection(doc(db, "tuktuks", $page.params.id), fieldName);
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { status: "approved" });
            console.log(`Field "${fieldName}" updated to "approved".`);
        } else {
            console.log("No documents found to approve.");
        }
    }

    async function changeStatus(currentState) {
        const documentRef = doc(db, "tuktuks", $page.params.id)
        await updateDoc(documentRef, { "isValid": !currentState })
        alertMessage = document.isValid ?  "Tuktuk successfully validated" : "Tuktuk successfully blocked"
        showAlert = true
        setTimeout(() => {
            showAlert = false;
        }, 2000);
    }
</script>
<div class="w-full" style="margin: 20px">
    <div class="flex items-center space-x-2">
        <Button outline color="dark" size="xs" on:click={() => history.back()}><ArrowLeftOutline class="w-4 h-4" /></Button>
    </div>
    {#if loading}
        <p style="margin-top: 20px"><Spinner/> Loading Tuk...</p>
    {:else if error}
        <p>{error}</p>
    {:else}
        <Card size="lg" style="margin-top: 20px">
            {#if showAlert}
                <Alert color="green" dismissable transition={slide} style="margin-top: 10px">
                    <svelte:fragment slot="icon">
                        <CheckCircleSolid class="w-5 h-5" />
                        <span class="sr-only">Check icon</span>
                    </svelte:fragment>
                    <span class="font-medium">{alertMessage}</span>
                </Alert>
            {/if}
            <Badge border color={tuktukDoc?.isValid ? 'green' : 'red'}>{tuktukDoc?.isValid ? "Ok" : "Blocked"}</Badge>
            <span class="mt-3" style="height: 40px">Dados do Tuk</span>
            <div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">License Plate</Label>
                    <div class="flex items-center space-x-2">
                        <div id="insurance-company" class="readonly-input">{tuktukDoc?.licensePlate}</div>
                    </div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Seats</Label>
                    <div class="flex items-center space-x-2">
                        <div id="insurance-company" class="readonly-input">{tuktukDoc?.seats}</div>
                    </div>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Electric</Label>
                    <div class="flex items-center space-x-2">
                        <div id="insurance-company" class="readonly-input">{tuktukDoc?.electric ? "Yes" : "No"}</div>
                    </div>
                </div>
            </div>
            {#if $authUser.isAdmin}
                <div class="mb-6">
                    <Button pill color="light" style="margin-top: 10px" on:click={() => (validateAccountConfirmation = true)}>{tuktukDoc?.isValid ? "Block Tuktuk" : "Validate Tuktuk"}</Button>
                    <Modal title={tuktukDoc?.isValid ? 'Block Tuktuk' : 'Validate Tuktuk'} bind:open={validateAccountConfirmation} autoclose>
                        <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Are you sure you want to {tuktukDoc?.isValid ? "block" : "validate"} this Tuktuk.</p>
                        <svelte:fragment slot="footer">
                            <Button on:click={() => changeStatus(tuktukDoc?.isValid)}>Yes</Button>
                            <Button color="alternative">No</Button>
                        </svelte:fragment>
                    </Modal>
                </div>
            {/if}
        </Card>
        <Card size="lg" style="margin-top: 20px">
            <Accordion style="margin-top: 20px; margin-bottom: 20px">
                <AccordionItem>
                    {#if vehicleDocument?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(vehicleDocument?.status)}>{vehicleDocument?.status.toUpperCase()}{  (vehicleDocument != null && vehicleDocument.submitDate != null) ? ' - Submetido a: ' + new Date(vehicleDocument.submitDate.seconds * 1000).toLocaleString() : '' }</Badge>
                        </div>
                    {/if}
                    <span slot="header" class="flex items-center gap-2">
                        {#if vehicleDocument?.status === "approved"}
                            <CheckCircleSolid color="green" />
                        {/if}
                        {#if vehicleDocument?.status === "rejected"}
                            <CloseCircleSolid color="red" />
                        {/if}
                        {#if vehicleDocument?.status === "pending"}
                            <ClockSolid color="dark" />
                        {/if}
                            Documento Único
                    </span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if vehicleInfoFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each vehicleInfoFiles as file}
                                    <div class="relative w-20 h-20 previewImage">
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
                        <Button pill color="light" on:click={() => approve("vehicleDocument")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editing = true}>Novo Documento</Button>
                        </div>
                        <Modal title="Documentos do Veículo" bind:open={editing} autoclose={!isUploading}>
                            <div class="mb-0">
                                <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                <Helper class='ml-3 mt-0' color='red'><span class="font-small">- Documento Único</span></Helper>
                                <input type="file" accept="image/*" bind:this={fileVehicleInfoInput} multiple onchange={selectVehicleInfoFiles} style="display: none" />
                                {#if localVehicleInfoPreviews.length > 0}
                                    <div class="flex gap-2 mt-2">
                                        {#each localVehicleInfoPreviews as preview, index}
                                            <div class="relative w-20 h-20 previewImage">
                                                <!-- Image Preview -->
                                                <img src={preview} alt="Documentos" class="w-full h-full object-cover rounded-md" />
                                                <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeVehicleInfoImage(index)}} >
                                                    ✕
                                                </button>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <div>
                                <Button size="xs" color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileVehicleInfoInput); }}>
                                    Adicionar
                                </Button>
                            </div>
                            <svelte:fragment slot="footer">
                                <Button on:click={() => submitVehicleData()}>Submeter</Button>
                                {#if isUploading}
                                    <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                {/if}
                            </svelte:fragment>
                        </Modal>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    {#if insuranceInfo?.status}
                        <div class="mb-6">
                            <Badge large color={getStatusColor(insuranceInfo?.status)}>{insuranceInfo?.status.toUpperCase()}{  (insuranceInfo != null && insuranceInfo.submitDate != null) ? ' - Submetido a: ' + new Date(insuranceInfo.submitDate.seconds * 1000).toLocaleString() : '' }</Badge>
                        </div>
                    {/if}
                    <span slot="header" class="flex items-center gap-2">
                        {#if insuranceInfo?.status === "approved"}
                            <CheckCircleSolid color="green" />
                        {/if}
                        {#if insuranceInfo?.status === "rejected"}
                            <CloseCircleSolid color="red" />
                        {/if}
                        {#if insuranceInfo?.status === "pending"}
                            <ClockSolid color="dark" />
                        {/if}
                        Apólice de Seguro do Veículo
                    </span>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                        <div id="insurance-company" class="readonly-input">{insuranceInfo?.name}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                        <div id="insurance-policy" class="readonly-input">{insuranceInfo?.number}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                        <div id="insurance-expiration" class="readonly-input">{formatDate(insuranceInfo?.expirationDate)}</div>
                    </div>
                    <div class="mb-6">
                        <Label for="input-group-1" class="block mb-2">Documentos</Label>
                        {#if insuranceInfoFiles.length > 0}
                            <div class="flex gap-2 mt-2">
                                {#each insuranceInfoFiles as file}
                                    <div class="relative w-20 h-20 previewImage">
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
                        <Button pill color="light" on:click={() => approve("vehicleInsurance")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editing = true}>Novo Documento</Button>
                        </div>
                        <Modal title="Apólice de Seguro do Veículo" bind:open={editing} autoclose={!isUploading}>
                            <div class="mb-6">
                                <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                                <Input id="companyName" bind:value={vehicleInsuranceCompanyName}/>
                            </div>
                            <div class="mb-6">
                                <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                                <Input id="policyNumber" bind:value={vehicleInsurancePolicyNumber}/>
                            </div>
                            <div class="mb-6">
                                <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                                <Input id="expirationDate" type="date" bind:value={vehicleInsuranceExpirationDate}/>
                            </div>
                            <div class="mb-0">
                                <Label for="input-group-1" class="block mb-2">Documentos</Label>
                                <Helper class='ml-3 mt-0' color='red'><span class="font-small">- Carta Verde</span></Helper>
                                <Helper class='ml-3 mt-0' color='red'><span class="font-small">- Recibo de Pagamento</span></Helper>
                                <input type="file" accept="image/*" bind:this={fileInput} multiple onchange={selectFiles} style="display: none" />
                                {#if localPreviews.length > 0}
                                    <div class="flex gap-2 mt-2">
                                        {#each localPreviews as preview, index}
                                            <div class="relative w-20 h-20 previewImage">
                                                <!-- Image Preview -->
                                                <img src={preview} alt="Documentos" class="w-full h-full object-cover rounded-md" />
                                                <button class="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full" onclick={(event) => {event.stopPropagation(); removeImage(index)}} >
                                                    ✕
                                                </button>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                            <Button size="xs" color="blue" on:click={(event) => { event.stopPropagation(); openFilePicker(fileInput); }}>
                                Adicionar
                            </Button>
                            <svelte:fragment slot="footer">
                                <Button on:click={() => submitVehicleInsurance()}>Submeter</Button>
                                {#if isUploading}
                                    <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                                {/if}
                            </svelte:fragment>
                        </Modal>
                    {/if}
                </AccordionItem>
                <AccordionItem>
                    <span slot="header" class="flex items-center gap-2">
                        {#if personalInsuranceData?.status === "approved"}
                            <CheckCircleSolid color="green" />
                        {/if}
                        {#if personalInsuranceData?.status === "rejected"}
                            <CloseCircleSolid color="red" />
                        {/if}
                        {#if personalInsuranceData?.status === "pending"}
                            <ClockSolid color="dark" />
                        {/if}
                        Apólice de Seguro de Acidentes Pessoais
                    </span>
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
                        <Button pill color="light" on:click={() => approve("personalAccidentInsurance")}>Aprovar</Button>
                    {/if}
                    {#if !$authUser.isAdmin}
                        <div>
                            <Button pill color="light" on:click={() => editingPersonalInsurance = true}>Novo</Button>
                            <Modal title="Apólice de Seguro de Acidentes Pessoais" bind:open={editingPersonalInsurance} autoclose={!isUploading}>
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
    .previewImage {
        margin-right: 20px;
    }
</style>

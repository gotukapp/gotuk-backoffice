<script>
    import {Button, Card, Input, Label, Modal, Spinner, Badge, Helper} from 'flowbite-svelte';
    import {ArrowLeftOutline} from 'flowbite-svelte-icons';
    import {onMount} from "svelte";
    import {db} from '$lib'
    import {getAllFilesFromFolder, getStatusColor, formatDate, openFilePicker, uploadImages} from '$lib/utils.js'
    import {
        collection,
        doc,
        getDoc,
        getDocs,
        limit, onSnapshot,
        orderBy,
        query,
        serverTimestamp,
        setDoc,
        updateDoc
    } from "firebase/firestore";
    import {page} from "$app/stores";
    import {authUser} from '$lib/stores/authUser.js'

    let editing = $state(false)
    let tuktukDoc = $state(null)
    let loading = $state(true)
    let error = $state(null)
    let insuranceInfo = $state(null)
    let vehicleInsuranceExpirationDate = $state("")
    let vehicleInsuranceCompanyName = $state("")
    let vehicleInsurancePolicyNumber = $state("")
    let insuranceInfoFiles = $state([])
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

    onMount(async () => {
        try {
            const id = $page.params.id;
            const docRef = doc(db, "tuktuks", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                tuktukDoc = docSnap.data();
                const documentsRef = collection(doc(db, "tuktuks", id), "documents");
                const queryDocuments = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
                unsubscribeInsuranceDoc = onSnapshot(queryDocuments, async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        insuranceInfo = querySnapshot.docs[0].data();
                        insuranceInfoFiles = await getAllFilesFromFolder(`uploads/tuktuks/vehicleInsurance/${$page.params.id}/${querySnapshot.docs[0].id}`)
                    }
                })

                unsubscribeVehicleInfoDoc = onSnapshot(queryDocuments, async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        vehicleInfoFiles = await getAllFilesFromFolder(`uploads/tuktuks/vehicleDocument/${$page.params.id}/${querySnapshot.docs[0].id}`)
                    }
                })

            } else {
                error = "Documento não encontrado!";
            }

            return () => {
                if (unsubscribeInsuranceDoc) unsubscribeInsuranceDoc();
                if (unsubscribeVehicleInfoDoc) unsubscribeVehicleInfoDoc();
            };
        } catch (e) {
            error = "Erro ao carregar documento: " + e.message;
        } finally {
            loading = false;
        }
    });

    async function submit() {
        isUploading = true
        const docRef = doc(collection(doc(db, "tuktuks", $page.params.id), "documents"))
        await uploadImages(`uploads/tuktuks/vehicleInsurance/${$page.params.id}/${docRef.id}`, selectedFiles, uploadProgress);
        await uploadImages(`uploads/tuktuks/vehicleDocument/${$page.params.id}/${docRef.id}`, selectedVehicleInfoFiles, uploadProgress);
        localPreviews.length = 0
        selectedFiles.length = 0
        await setDoc(docRef, {
            vehicleInsuranceCompanyName: vehicleInsuranceCompanyName,
            vehicleInsurancePolicyNumber: vehicleInsurancePolicyNumber,
            vehicleInsuranceExpirationDate: new Date(vehicleInsuranceExpirationDate),
            vehicleData: 'pending',
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

    async function approve(fieldName) {
        const documentsRef = collection(doc(db, "tuktuks", $page.params.id), "documents");
        const q = query(documentsRef, orderBy("submitDate", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { [fieldName]: "approved" });
            console.log(`Field "${fieldName}" updated to "approved".`);
        } else {
            console.log("No documents found to approve.");
        }
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
            <span style="height: 40px">Dados do Tuk</span>
            <div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">License Plate</Label>
                    <Input id="name" bind:value={tuktukDoc.licensePlate} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Seats</Label>
                    <Input id="name" bind:value={tuktukDoc.seats} readonly/>
                </div>
                <div class="mb-6">
                    <Label for="input-group-1" class="block mb-2">Electric</Label>
                    <Input id="name" bind:value={tuktukDoc.electric} readonly/>
                </div>
            </div>
        </Card>
        <Card size="lg" style="margin-top: 20px">
            {#if insuranceInfo?.vehicleData}
                <Badge large color={getStatusColor(insuranceInfo?.vehicleData)}>{insuranceInfo?.vehicleData.toUpperCase()}{  (insuranceInfo != null && insuranceInfo.submitDate != null) ? ' - Submetido a: ' + new Date(insuranceInfo.submitDate.seconds * 1000).toLocaleString() : '' }</Badge>
            {/if}
            <span style="height: 30px; margin-top: 20px; color:black">Documento Único</span>
            <div class="mb-6">
                <Label for="input-group-1" class="block mb-2">Imagens</Label>
                {#if vehicleInfoFiles.length > 0}
                    <div class="flex gap-2 mt-2">
                        {#each vehicleInfoFiles as file}
                            <div class="relative w-20 h-20 previewImage">
                                <a href={file} target="_blank" rel="noopener noreferrer">
                                    <img src={file} alt="Selected Image" class="w-full h-full object-cover rounded-md" />
                                </a>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
            <hr style="margin-bottom: 25px" />
            <span style="height: 40px; margin-top: 10px; color:black">Apólice de Seguro</span>
            <div class="mb-6">
                <Label for="input-group-1" class="block mb-2">Companhia de Seguros</Label>
                <div id="insurance-company" class="readonly-input">{insuranceInfo?.vehicleInsuranceCompanyName}</div>
            </div>
            <div class="mb-6">
                <Label for="input-group-1" class="block mb-2">Nº Apólice</Label>
                <div id="insurance-policy" class="readonly-input">{insuranceInfo?.vehicleInsurancePolicyNumber}</div>
            </div>
            <div class="mb-6">
                <Label for="input-group-1" class="block mb-2">Data de Validade</Label>
                <div id="insurance-expiration" class="readonly-input">{formatDate(insuranceInfo?.vehicleInsuranceExpirationDate)}</div>
            </div>
            <div class="mb-6">
                <Label for="input-group-1" class="block mb-2">Imagens</Label>
                {#if insuranceInfoFiles.length > 0}
                    <div class="flex gap-2 mt-2">
                        {#each insuranceInfoFiles as file}
                            <div class="relative w-20 h-20 previewImage">
                                <a href={file} target="_blank" rel="noopener noreferrer">
                                    <img src={file} alt="Selected Image" class="w-full h-full object-cover rounded-md" />
                                </a>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
            <hr style="margin-bottom: 25px" />
            {#if $authUser.isAdmin}
                <Button pill color="blue" on:click={() => approve("vehicleInsurance")}>Aprovar</Button>
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
                                        <img src={preview} alt="Selected Image" class="w-full h-full object-cover rounded-md" />
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
                    <hr style="margin-bottom: 25px" />
                    <span style="height: 40px; margin-top: 10px; color:black">Apólice de Seguro</span>
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
                                        <img src={preview} alt="Selected Image" class="w-full h-full object-cover rounded-md" />
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
                        <Button on:click={() => submit()}>Submeter</Button>
                        {#if isUploading}
                            <p>Uploading... {uploadProgress.toFixed(0)}%</p>
                        {/if}
                    </svelte:fragment>
                </Modal>
            {/if}
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

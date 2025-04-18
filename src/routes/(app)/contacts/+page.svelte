<script>
    import { Card } from 'flowbite-svelte';
    import { GlobeSolid, EnvelopeSolid, WhatsappSolid } from 'flowbite-svelte-icons';
    import { _ } from 'svelte-i18n';

    const siteUrl = 'https://gotuk.pt';
    const email = 'suporte@gotuk.pt';
    const whatsappNumber = '+1234567890';
    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`;
</script>

<div class="w-full min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
        <Card class="w-full rounded-2xl shadow p-6 bg-white">
            <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">{$_('contactUs')}</h2>

            <div class="space-y-6">
                <!-- Website -->
                <div class="flex items-center space-x-4">
                    <GlobeSolid class="w-6 h-6 text-blue-600" />
                    <a href={siteUrl} target="_blank" class="text-lg text-blue-600 hover:underline">
                        {siteUrl}
                    </a>
                </div>

                <!-- Email -->
                <div class="flex items-center space-x-4">
                    <EnvelopeSolid class="w-6 h-6 text-green-600" />
                    <a href={`mailto:${email}`} class="text-lg text-green-600 hover:underline">
                        {email}
                    </a>
                </div>

                <!-- WhatsApp -->
                <div class="flex items-center space-x-4">
                    <WhatsappSolid class="w-6 h-6 text-emerald-600" />
                    <a href={whatsappLink} target="_blank" class="text-lg text-emerald-600 hover:underline">
                        {whatsappNumber}
                    </a>
                </div>
            </div>
        </Card>
    </div>
</div>

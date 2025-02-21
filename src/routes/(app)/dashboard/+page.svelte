<script>
    import { Chart, Card, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';
    import {onMount} from "svelte";
    import {collection, getCountFromServer, where, query} from "firebase/firestore";
    import {db} from "$lib";

    let dropdownOpen = false;
    let allTrips = null;
    let bookedTrips = null;
    let selectedDateRange = "Last 30 days";

    onMount(async () => {
        await refreshChartOptions();
        await bookedTripsChart();
    });

    async function refreshChartOptions() {
        const tripsSeries = [
            await countTripsByStatus("pending", calculateDateRange(selectedDateRange)),
            await countTripsByStatus("booked", calculateDateRange(selectedDateRange)),
            await countTripsByStatus("started", calculateDateRange(selectedDateRange)),
            await countTripsByStatus("finished", calculateDateRange(selectedDateRange)),
            await countTripsByStatus("canceled", calculateDateRange(selectedDateRange))];

        allTrips = {
            series: tripsSeries,
            colors: ['#FDBA8C', '#16BDCA', '#E74694', '#1C64F2', '#E74694'],
            chart: {
                height: 320,
                width: '100%',
                type: 'donut'
            },
            stroke: {
                colors: ['transparent'],
                lineCap: ''
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontFamily: 'Inter, sans-serif',
                                offsetY: 20
                            },
                            total: {
                                showAlways: true,
                                show: true,
                                label: 'Total trips',
                                fontFamily: 'Inter, sans-serif',
                                formatter: function (w) {
                                    const sum = w.globals.seriesTotals.reduce((a, b) => {
                                        return a + b;
                                    }, 0);
                                    return `${sum}`;
                                }
                            },
                            value: {
                                show: true,
                                fontFamily: 'Inter, sans-serif',
                                offsetY: -20,
                                formatter: function (value) {
                                    return value;
                                }
                            }
                        },
                        size: '80%'
                    }
                }
            },
            grid: {
                padding: {
                    top: -2
                }
            },
            labels: ['Pending', 'Booked', 'Start', 'Finished', 'Canceled'],
            dataLabels: {
                enabled: false
            },
            legend: {
                position: 'bottom',
                fontFamily: 'Inter, sans-serif'
            },
            yaxis: {
                labels: {
                    formatter: function (value) {
                        return value;
                    }
                }
            },
            xaxis: {
                labels: {
                    formatter: function (value) {
                        return value;
                    }
                },
                axisTicks: {
                    show: false
                },
                axisBorder: {
                    show: false
                }
            }
        };
    }

    async function generateSeries(daysCount) {
        const series = [];
        let currentDay = new Date();

        for (let i = 0; i < daysCount; i++) {
            const day = new Date(currentDay.setHours(0,0,0));
            const formattedDay = day.toLocaleDateString();
            const count = await countBookedTripsByDay(day);

            series.push({ x: formattedDay, y: count });

            // Move to the next day
            currentDay.setDate(currentDay.getDate() + 1);
        }

        return series;
    }

    async function bookedTripsChart() {
        const series = await generateSeries(10)

        bookedTrips = {
            chart: {
                height: 400,
                type: 'area',
                fontFamily: 'Inter, sans-serif',
                dropShadow: {
                    enabled: false
                },
                toolbar: {
                    show: false
                }
            },
            tooltip: {
                enabled: true,
                x: {
                    show: false
                }
            },
            series: [
                {
                    name: '',
                    data: series,
                    color: '#1A56DB'
                }
            ]
        };
    }

    async function countTripsByStatus(status, dateFilter) {
        const q = query(
            collection(db, "trips"),
            where("status", "==", status),
            where("date", ">", dateFilter)
        );

        try {
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error("Error counting documents:", error);
            return 0;
        }
    }

    async function countBookedTripsByDay(day) {
        const q = query(
            collection(db, "trips"),
            where("status", "==", 'booked'),
            where("date", ">=", day),
            where("date", "<", day.setDate(day.getDate() + 1))
        );

        try {
            const snapshot = await getCountFromServer(q);
            console.log(snapshot.data().count)
            return snapshot.data().count;
        } catch (error) {
            console.error("Error counting documents:", error);
            return 0;
        }
    }

    function updateDateFilter(range) {
        selectedDateRange = range;
        refreshChartOptions();
        dropdownOpen = false
    }

    function calculateDateRange(range) {
        const today = new Date();
        switch (range) {
            case "Yesterday":
                return new Date(today.setDate(today.getDate() - 1));
            case "Today":
                return new Date();
            case "Last 7 days":
                return new Date(today.setDate(today.getDate() - 7));
            case "Last 30 days":
                return new Date(today.setDate(today.getDate() - 30));
            case "Last 90 days":
                return new Date(today.setDate(today.getDate() - 90));
            default:
                return new Date(); // Default to today
        }
    }
</script>
<div class="w-full" style="margin: 20px">
    <div class="grid grid-cols-1">
        <div class="flex justify-between">
            <Button class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 text-center inline-flex items-center dark:hover:text-white bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent focus:ring-transparent dark:focus:ring-transparent py-0">{selectedDateRange}<ChevronDownOutline class="w-2.5 m-2.5 ms-1.5" /></Button>
            <Dropdown bind:open={dropdownOpen} class="w-40" offset="-6">
                <DropdownItem on:click={() => updateDateFilter("Yesterday")}>Yesterday</DropdownItem>
                <DropdownItem on:click={() => updateDateFilter("Today")}>Today</DropdownItem>
                <DropdownItem on:click={() => updateDateFilter("Last 7 days")}>Last 7 days</DropdownItem>
                <DropdownItem on:click={() => updateDateFilter("Last 30 days")}>Last 30 days</DropdownItem>
                <DropdownItem on:click={() => updateDateFilter("Last 90 days")}>Last 90 days</DropdownItem>
            </Dropdown>
        </div>
    </div>
    <div class="flex flex-col justify-start">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
            <Card>
                <div class="flex justify-between items-start w-full">
                    <div class="flex-col items-center">
                        <div class="flex items-center mb-1">
                            <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white me-1">Trips</h5>
                        </div>
                    </div>
                </div>
                {#if allTrips}
                    <Chart options="{allTrips}" class="py-6" />
                {:else}
                    <div class="flex justify-center items-center py-6">
                        <div class="loader" role="status">
                            Loading chart...
                        </div>
                    </div>
                {/if}

</Card>
            <Card>
                <div class="flex justify-between items-start w-full">
                    <div class="flex-col items-center">
                        <div class="flex items-center mb-1">
                            <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white me-1">Booked Trips</h5>
                        </div>
                    </div>
                </div>
                {#if bookedTrips}
                    <Chart bind:options={bookedTrips} />
                {:else}
                    <div class="flex justify-center items-center py-6">
                        <div class="loader" role="status">
                            Loading chart...
                        </div>
                    </div>
                {/if}
            </Card>
        </div>
    </div>
</div>

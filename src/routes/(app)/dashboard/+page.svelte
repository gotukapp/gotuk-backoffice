<script>
    import { Chart, Card, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';
    import {onMount} from "svelte";
    import {collection, getCountFromServer, where, query, getDocs} from "firebase/firestore";
    import {db} from "$lib";
    import {authUser} from '$lib/stores/authUser.js'
    import {goto} from "$app/navigation";

    let dropdownOpen = false;
    let tripsByStatus = null;
    let tripsByTour = null;
    let bookedTrips = null;
    let selectedDateRange = "Last 30 days";

    onMount(async () => {
        const firebaseUser = $authUser.user
        if (firebaseUser?.isAdmin) {
            await refreshChartOptions();
            await bookedTripsChart();
        } else {
            await goto('/organizations');
        }
    });

    async function refreshChartOptions() {
        const dateRange = calculateDateRange(selectedDateRange)

        const q = query(
            collection(db, "trips"),
            where("date", ">", dateRange)
        );

        const snapshot = await getDocs(q);
        const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        tripsByStatus = {
            series: [result.filter(a => a.status === "pending").length,
                result.filter(a => a.status === "booked").length,
                result.filter(a => a.status === "started").length,
                result.filter(a => a.status === "finished").length,
                result.filter(a => a.status === "canceled").length],
            colors: ['#fa6b13',
                '#fff300',
                '#169100',
                '#1c4ef2',
                '#F21C1C'],
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
                                label: 'Total',
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

        tripsByTour = {
            series: [result.filter(a => a.tourId.id === "iFeHZGf61ZR6RsCxZFUf").length,
                result.filter(a => a.tourId.id === "iPvTzM9QAK99KjlmWOQc").length,
                result.filter(a => a.tourId.id === "lrBbhAD64JMbq81yjUAF").length,
                result.filter(a => a.tourId.id === "s8xkuv1KCEfOAvOe5V8W").length],
            colors: ['#3cedbb',
                '#008dbf',
                '#563ad1',
                '#1d0d98' +
                ''],
            chart: {
                height: 320,
                width: '100%',
                type: 'pie'
            },
            stroke: {
                colors: ['transparent'],
                lineCap: ''
            },
            plotOptions: {
                pie: {
                    labels: {
                        show: true
                    },
                    size: '100%',
                    dataLabels: {
                        offset: -25
                    }
                }
            },
            grid: {
                padding: {
                    top: -2
                }
            },
            labels: ['Discoveries in Belém', 'Lisboa New City', 'Lisboa Old City', 'Three sight hills'],
            dataLabels: {
                enabled: true,
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
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
                        return value + '%';
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

    async function countBookedTripsByDay(day) {
        const dayEnd = new Date(day.getTime() + (24 * 60 * 60 * 1000))
        const q = query(
            collection(db, "trips"),
            where("status", "==", 'booked'),
            where("date", ">=", day),
            where("date", "<", dayEnd)
        );

        try {
            const snapshot = await getCountFromServer(q);
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
<div class="w-full p-5" style="margin: 20px">
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card size="xl">
            <div class="flex justify-between items-start w-full">
                <div class="flex-col items-center">
                    <div class="flex items-center mb-1">
                        <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white me-1">Tours by Status</h5>
                    </div>
                </div>
            </div>
            {#if tripsByStatus}
                <Chart options="{tripsByStatus}" class="py-6" />
            {:else}
                <div class="flex justify-center items-center py-6">
                    <div class="loader" role="status">Loading chart...</div>
                </div>
            {/if}
        </Card>

        <Card size="xl">
            <div class="flex justify-between items-start w-full">
                <div class="flex-col items-center">
                    <div class="flex items-center mb-1">
                        <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white me-1">Tours</h5>
                    </div>
                </div>
            </div>
            {#if tripsByTour}
                <Chart bind:options={tripsByTour} />
            {:else}
                <div class="flex justify-center items-center py-6">
                    <div class="loader" role="status">Loading chart...</div>
                </div>
            {/if}
        </Card>

        <Card size="xl">
            <div class="flex justify-between items-start w-full">
                <div class="flex-col items-center">
                    <div class="flex items-center mb-1">
                        <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white me-1">Booked Tours</h5>
                    </div>
                </div>
            </div>
            {#if bookedTrips}
                <Chart bind:options={bookedTrips} />
            {:else}
                <div class="flex justify-center items-center py-6">
                    <div class="loader" role="status">Loading chart...</div>
                </div>
            {/if}
        </Card>
    </div>
</div>

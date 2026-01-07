"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { changeOrderPaymentStatus, changeOrderStatus } from "@/lib/api_/orders";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import dayjs from "dayjs";
import { formatAmount } from "@/utils/formatCurrency";
import SelectDropdown from "@/app/components/commons/Fields/SelectDropdown";
import toast from "react-hot-toast";
import { getBookingDetail } from "@/lib/api_/bookings";
// Reverted to React Icons
import { FiCalendar, FiClock, FiMapPin, FiShield, FiUser, FiMail, FiPhone } from "react-icons/fi";

const statusOptions = [
    { label: "Processing", value: "processing" },
    { label: "Ongoing", value: "ongoing" },
    { label: "Completed", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
];

const paymentStatusOptions = [
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
    { label: "Refunded", value: "refunded" },
];

function CustomerSummary({ customer, stats }: { customer: any; stats: any }) {
    return (
        <div className="bg-white rounded-xl p-6 flex flex-wrap items-center justify-between shadow-sm border border-gray-50 text-sm">
            <div className="flex items-center gap-4 min-w-[250px]">
                <div className="relative w-16 h-16 rounded-full border-2 border-hub-primary overflow-hidden">
                    <Image
                        src={customer.profile_photo}
                        alt={customer.name}
                        fill
                        className="object-cover"
                    />
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-base flex items-center gap-1">
                        <FiUser className="text-gray-400" /> {customer.name}
                    </p>
                    <p className="text-gray-500 flex items-center gap-1"><FiMail /> {customer.email}</p>
                    <p className="text-gray-500 flex items-center gap-1"><FiPhone /> {customer.phone}</p>
                </div>
            </div>

            <div className="hidden md:block w-px h-16 bg-gray-100" />

            <div className="space-y-2 min-w-[200px]">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <FiMapPin /> Service Address
                </p>
                <p className="text-gray-700 leading-relaxed max-w-[200px]">
                    {customer.address || "No address provided"}
                </p>
            </div>

            <div className="hidden md:block w-px h-16 bg-gray-100" />

            <div className="flex gap-8 text-center bg-gray-50 p-4 rounded-lg">
                <div>
                    <p className="font-bold text-gray-900">{stats?.total_bookings || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Bookings</p>
                </div>
                <div>
                    <p className="font-bold text-hub-secondary">{formatAmount(stats?.total_revenue || 0)}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Spent</p>
                </div>
                <div>
                    <p className="font-bold text-green-600">{stats?.total_completed || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Completed</p>
                </div>
            </div>
        </div>
    );
}

export default function OrderDetail() {
    const params = useParams();
    const orderId = params?.id as string | undefined;

    const [booking, setBooking] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            try {
                const response = await getBookingDetail(orderId);
                setStats(response.data.stats);
                setBooking(response.data.booking);
            } catch (err) {
                console.error("Failed to load booking", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    if (loading || !booking) return <div className="p-6"><Skeleton height={40} count={5} /></div>;

    const handleStatusChange = async (val: any, type: 'order' | 'payment') => {
        setUpdating(true);
        try {
            if (type === 'order') await changeOrderStatus(booking.id, val.value);
            else await changeOrderPaymentStatus(booking.id, val.value);

            setBooking((prev: any) => ({
                ...prev,
                [type === 'order' ? 'delivery_status' : 'payment_status']: val.value,
            }));
            toast.success("Status updated successfully");
        } catch {
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };
    const getCountdown = (startDate: string, endDate: string) => {
        const now = dayjs();
        const start = dayjs(startDate);
        const end = dayjs(endDate);

        if (now.isAfter(end)) return { text: "Service Delivered", color: "text-gray-400" };
        if (now.isAfter(start) && now.isBefore(end)) return { text: "Currently In Progress", color: "text-green-600" };

        const diffDays = start.diff(now, 'day');
        const diffHours = start.diff(now, 'hour');

        if (diffDays > 0) {
            return { text: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} remaining`, color: "text-hub-secondary" };
        }
        return { text: `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} remaining`, color: "text-orange-600" };
    };

    const countdown = getCountdown(booking.start_date, booking.end_date);

    return (
        <div className="p-6 text-gray-600 space-y-6 max-w-7xl mx-auto bg-white rounded-md">
            <div className="flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Booking Details - #{booking.id}</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Service Method: <span className="text-hub-secondary font-semibold uppercase">{booking.delivery_method}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Service Status</span>
                        <SelectDropdown
                            options={statusOptions}
                            value={statusOptions.find(o => o.value === booking.delivery_status) || statusOptions[0]}
                            onChange={(val) => handleStatusChange(val, 'order')}
                            disabled={updating}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase ml-1">Payment Status</span>
                        <SelectDropdown
                            options={paymentStatusOptions}
                            value={paymentStatusOptions.find(o => o.value === booking.payment_status) || paymentStatusOptions[0]}
                            onChange={(val) => handleStatusChange(val, 'payment')}
                            disabled={updating}
                        />
                    </div>
                </div>
            </div>

            <CustomerSummary customer={booking.customer} stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Service Card */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-50 overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2">
                        <FiShield className="text-hub-primary" /> Booked Service Information
                    </div>
                    <div className="p-6 flex flex-col md:flex-row gap-6">
                        <div className="relative w-full md:w-40 h-40 rounded-lg overflow-hidden">
                            <Image src={booking.service.image} alt="service" fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">{booking.service.title}</h2>
                            <p className="text-hub-secondary font-medium text-sm mb-4">By {booking.shop.name}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-dashed">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg text-hub-secondary"><FiCalendar size={20} /></div>
                                    <div>
                                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-tighter">Start Date</p>
                                        <p className="text-sm font-bold">{dayjs(booking.start_date).format("DD MMM, YYYY")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg text-hub-secondary"><FiClock size={20} /></div>
                                    <div>
                                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-tighter">Time Window</p>
                                        <p className="text-sm font-bold">
                                            {dayjs(booking.start_date).format("hh:mm A")} - {dayjs(booking.end_date).format("hh:mm A")}
                                        </p>
                                    </div>
                                </div>
                                {/* New Countdown Section */}
                                <div className="flex items-center gap-3 border-l pl-4 border-gray-100">
                                    <div className={`p-2 rounded-lg bg-gray-50 ${countdown.color}`}><FiClock size={20} /></div>
                                    <div>
                                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-tighter">Countdown</p>
                                        <p className={`text-sm font-black ${countdown.color}`}>
                                            {countdown.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Sidebar */}
                <div className="bg-white rounded-xl border border-gray-50 shadow-sm p-6 space-y-6">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Financial Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Service Fee</span>
                            <span className="font-semibold text-gray-800">{formatAmount(booking.amount)}</span>
                        </div> 
                        <div className="pt-3 border-t flex justify-between items-center">
                            <span className="font-bold text-gray-900">Total Payable</span>
                            <span className="text-xl font-black text-hub-secondary">{formatAmount(booking.amount)}</span>
                        </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-[11px] text-orange-700 leading-relaxed border border-orange-100">
                        * This booking is for a <strong>{booking.delivery_method}</strong> session. Ensure the customer is available during the selected time slot.
                    </div>
                </div>
            </div>
        </div>
    );
}
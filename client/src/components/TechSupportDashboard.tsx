import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
    Users,
    BookMarked,
    History,
    Download,
    Bell,
    Layout,
    CheckCircle,
    Clock,
    Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Link } from "wouter";
import { KathaipomFeed } from "@/components/KathaipomFeed";
import { MessageSquare as MessageSquareIcon } from "lucide-react";

interface TechSupportMetrics {
    totalClasses: number;
    totalStudents: number;
    recentRecords: {
        studentName: string;
        className: string;
        date: string;
        status: string;
        markedAt: string;
    }[];
}

export default function TechSupportDashboard({ userDisplayName }: { userDisplayName: string }) {
    const { data: metrics, isLoading } = useQuery<TechSupportMetrics>({
        queryKey: ["/api/tech-support/dashboard"],
    });

    const { toast } = useToast();

    const notifyMutation = useMutation({
        mutationFn: async () => {
            console.log('[notifyMutation] Triggering notification API...');
            const response = await apiRequest("POST", "/api/tech-support/notify-students");
            const data = await response.json();
            console.log('[notifyMutation] API Response:', data);
            return data;
        },
        onSuccess: (data) => {
            console.log('[notifyMutation] Success:', data);
            toast({
                title: "Success",
                description: data.message || "Absent students notified successfully",
            });
        },
        onError: (error: any) => {
            console.error('[notifyMutation] Error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to notify students",
                variant: "destructive",
            });
        },
    });

    // Export data function
    const exportData = () => {
        if (!metrics?.recentRecords || metrics.recentRecords.length === 0) {
            toast({
                title: "No Data",
                description: "No attendance records to export",
                variant: "destructive",
            });
            return;
        }

        // Build export data from recent records
        const exportRows = metrics.recentRecords.map((record, index) => ({
            "S.No": index + 1,
            "Student Name": record.studentName,
            "Class": record.className,
            "Date": record.date,
            "Status": record.status,
            "Marked At": record.markedAt,
        }));

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Records");

        // Auto-size columns
        ws['!cols'] = [
            { wch: 6 },   // S.No
            { wch: 25 },  // Student Name
            { wch: 20 },  // Class
            { wch: 12 },  // Date
            { wch: 10 },  // Status
            { wch: 20 },  // Marked At
        ];

        // Export file
        const fileName = `Attendance_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast({
            title: "Exported!",
            description: `Data exported to ${fileName}`,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Clock className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Dashboard <span className="text-slate-500 font-medium text-2xl ml-2 tracking-tight">Welcome back, {userDisplayName}!</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Content (Metrics, Actions, Tables) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Total Classes - Blue */}
                        <Card className="bg-blue-600 text-white border-none shadow-lg transform hover:scale-[1.02] transition-all">
                            <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center space-y-2">
                                <Layout className="h-8 w-8 opacity-80" />
                                <div className="space-y-1">
                                    <div className="text-3xl font-bold">{metrics?.totalClasses || 0}</div>
                                    <div className="text-[10px] opacity-90 font-black uppercase tracking-widest">Total Classes</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Students - Cyan */}
                        <Card className="bg-[#00CFE8] text-white border-none shadow-lg transform hover:scale-[1.02] transition-all">
                            <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center space-y-2">
                                <Users className="h-8 w-8 opacity-80" />
                                <div className="space-y-1">
                                    <div className="text-3xl font-bold">{metrics?.totalStudents || 0}</div>
                                    <div className="text-[10px] opacity-90 font-black uppercase tracking-widest">Total Students</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Records - Green */}
                        <Card className="bg-[#28C76F] text-white border-none shadow-lg transform hover:scale-[1.02] transition-all">
                            <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center text-center space-y-2">
                                <CheckCircle className="h-8 w-8 opacity-80" />
                                <div className="space-y-1">
                                    <div className="text-3xl font-bold">{metrics?.recentRecords.length || 0}</div>
                                    <div className="text-[10px] opacity-90 font-black uppercase tracking-widest">Recent Records</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <Link href="/classes">
                                <div className="group cursor-pointer">
                                    <div className="h-28 flex flex-col items-center justify-center border-2 border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-4 transition-all group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 group-hover:shadow-lg">
                                        <BookMarked className="h-8 w-8 text-blue-500 mb-2" />
                                        <span className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-widest text-center">Manage Classes</span>
                                    </div>
                                </div>
                            </Link>

                            <div className="group cursor-pointer">
                                <div className="h-28 flex flex-col items-center justify-center border-2 border-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/10 rounded-2xl p-4 transition-all group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/20 group-hover:shadow-lg">
                                    <History className="h-8 w-8 text-cyan-500 mb-2" />
                                    <span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase text-[10px] tracking-widest text-center">View History</span>
                                </div>
                            </div>

                            <div className="group cursor-pointer" onClick={exportData}>
                                <div className="h-28 flex flex-col items-center justify-center border-2 border-green-400 bg-green-50/50 dark:bg-green-900/10 rounded-2xl p-4 transition-all group-hover:bg-green-100 dark:group-hover:bg-green-900/20 group-hover:shadow-lg">
                                    <Download className="h-8 w-8 text-green-500 mb-2" />
                                    <span className="text-green-600 dark:text-green-400 font-bold uppercase text-[10px] tracking-widest text-center">Export Data</span>
                                </div>
                            </div>

                            <div
                                className={`group cursor-pointer ${notifyMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !notifyMutation.isPending && notifyMutation.mutate()}
                            >
                                <div className="h-28 flex flex-col items-center justify-center border-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl p-4 transition-all hover:bg-yellow-100 dark:hover:bg-yellow-900/20 hover:shadow-lg">
                                    {notifyMutation.isPending ? (
                                        <Loader2 className="h-8 w-8 text-yellow-500 mb-2 animate-spin" />
                                    ) : (
                                        <Bell className="h-8 w-8 text-yellow-500 mb-2" />
                                    )}
                                    <span className="text-yellow-600 dark:text-yellow-400 font-bold uppercase text-[10px] tracking-widest text-center">Notify Students</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Records Table */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Recent Attendance Records</h2>
                        </div>
                        <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Class</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Marked At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {metrics?.recentRecords.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">{record.studentName}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs inline-block">
                                                        {record.className}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                                    {format(new Date(record.date), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${record.status === 'Present'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-500 text-xs font-medium">
                                                    {format(new Date(record.markedAt), 'MMM dd, yyyy h:mm a')}
                                                </td>
                                            </tr>
                                        ))}
                                        {metrics?.recentRecords.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                    No recent records found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Team Feed */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center gap-2 p-1">
                            <MessageSquareIcon className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Team Feed</h2>
                        </div>
                        <Card className="shadow-green-lg hover:shadow-green-bright transition-shadow duration-300 border border-border overflow-hidden rounded-2xl bg-zinc-950">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-920 dark:to-purple-920 pb-4 border-b">
                                <CardTitle className="text-xl font-bold dark:text-white">
                                    Kathaipom
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 h-[800px] overflow-hidden">
                                <KathaipomFeed />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

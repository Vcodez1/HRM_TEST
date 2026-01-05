import { useQuery, useMutation } from "@tanstack/react-query";
import { Class, InsertClass, insertClassSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Layout, Calendar, MoreVertical, Pencil, Trash2, ArrowLeft, CheckCircle2, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useLocation } from "wouter";

type ClassWithCount = Class & { studentCount: number };

const classFormSchema = insertClassSchema.omit({ instructorId: true });
type ClassFormValues = z.infer<typeof classFormSchema>;

export default function MyClassesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: classesList, isLoading } = useQuery<ClassWithCount[]>({
        queryKey: ["/api/classes/with-counts", { instructorId: user?.id }],
        enabled: !!user,
    });

    const form = useForm<ClassFormValues>({
        resolver: zodResolver(classFormSchema),
        defaultValues: {
            name: "",
            subject: "",
        },
    });

    // Handle form submission
    const onSubmit = (data: ClassFormValues) => {
        console.log("Form submitted with data:", data);
        createClassMutation.mutate(data as any);
    };


    const createClassMutation = useMutation({
        mutationFn: async (data: InsertClass) => {
            const response = await apiRequest("POST", "/api/classes", data);
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Class created successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/classes/with-counts"] });
            setIsCreateModalOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        },
    });

    const deleteClassMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/classes/${id}`);
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Class deleted successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/classes/with-counts"] });
        },
    });


    if (isLoading) {
        return (
            <div className="flex h-screen bg-[#F1F5F9]">
                <Sidebar />
                <main className="flex-1 p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-48 bg-gray-200 rounded"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-48 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F1F5F9]">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Back Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation("/")}
                        className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200 gap-2 rounded-lg"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                                <Layout className="h-8 w-8 text-slate-700" />
                            </div>
                            <h1 className="text-4xl font-bold text-slate-900">
                                My Classes
                            </h1>
                        </div>
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 h-11 px-8 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
                                    <Plus className="h-5 w-5" />
                                    Add Class
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                                <div className="bg-[#4F46E5] p-6 text-white flex items-center gap-3">
                                    <Plus className="h-6 w-6" />
                                    <DialogTitle className="text-xl font-bold text-white">Add New Class</DialogTitle>
                                </div>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-600 font-semibold">Class Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Computer Science 101" {...field} className="rounded-xl h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="subject"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-600 font-semibold">Subject</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g., Computer Science"
                                                            {...field}
                                                            className="rounded-xl h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                                            value={field.value || ""}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex gap-4 pt-4">
                                            <Button
                                                variant="secondary"
                                                type="button"
                                                onClick={() => setIsCreateModalOpen(false)}
                                                className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 h-12 rounded-xl font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={createClassMutation.isPending}
                                                className="flex-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white h-12 rounded-xl font-semibold px-8 gap-2"
                                            >
                                                {createClassMutation.isPending ? "Adding..." : <><CheckCircle2 className="h-4 w-4" /> Add Class</>}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {classesList?.map((cls) => (
                            <Card key={cls.id} className="group hover:shadow-2xl transition-all duration-500 border-slate-200 rounded-[2rem] overflow-hidden bg-white">
                                <CardHeader className="pb-6 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <CardTitle className="text-2xl font-bold text-slate-900 mb-1">
                                                {cls.name}
                                            </CardTitle>
                                            <CardDescription className="text-lg font-medium text-slate-500 uppercase tracking-wide">
                                                {cls.subject || "N/A"}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-slate-50 rounded-full">
                                                    <MoreVertical className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 p-2 min-w-[160px] shadow-xl">
                                                <DropdownMenuItem className="text-slate-600 gap-3 cursor-pointer rounded-xl h-11">
                                                    <Pencil className="h-4 w-4" /> Edit Class
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-500 gap-3 cursor-pointer focus:text-red-600 focus:bg-red-50 rounded-xl h-11"
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure you want to delete this class?")) {
                                                            deleteClassMutation.mutate(cls.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Delete Class
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Users className="h-5 w-5 text-slate-400" />
                                            <span className="font-semibold">{cls.studentCount} students</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="h-5 w-5 text-slate-400" />
                                            <span>Created: {cls.createdAt ? format(new Date(cls.createdAt), "MMM d, yyyy") : "N/A"}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-0">
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 gap-2">
                                            <Users className="h-4 w-4" /> Students
                                        </Button>
                                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Attendance
                                        </Button>
                                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 gap-2">
                                            <Award className="h-4 w-4" /> Marks
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-amber-400/30 text-amber-600 hover:bg-amber-50 gap-2">
                                            <Pencil className="h-4 w-4" /> Edit
                                        </Button>
                                        <Button variant="outline" className="flex-1 rounded-xl h-11 border-red-200 text-red-600 hover:bg-red-50 gap-2">
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {classesList?.length === 0 && (
                            <div className="col-span-full py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <Layout className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">No classes found</h3>
                                <p className="text-slate-500 mt-2 max-w-sm text-lg">
                                    Click "Add Class" to start managing your students and attendance.
                                </p>
                                <Button
                                    className="mt-8 bg-[#4F46E5] hover:bg-[#4338CA] px-8 py-6 text-lg rounded-2xl h-auto"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    Create your first class
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

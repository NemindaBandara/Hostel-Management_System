import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { CommonArea } from '@/types';
import { X, Save, Bath, BookOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

interface CommonAreaModalProps {
    isOpen: boolean;
    onClose: () => void;
    area: CommonArea | null;
    onUpdate: () => void; // Trigger a refresh of the grid
}

export default function CommonAreaModal({ isOpen, onClose, area, onUpdate }: CommonAreaModalProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (area) {
            // Convert assets object to array for state editing
            const assetObj = area.assets || {};
            const assetsArray = Object.entries(assetObj).map(([name, data]: [string, any]) => ({
                name,
                working: data.working || 0,
                notWorking: data.notWorking || 0
            }));
            setAssets(assetsArray);
        }
    }, [area]);

    if (!area) return null;

    const handleAssetChange = (index: number, field: 'working' | 'notWorking', value: number) => {
        const updatedAssets = [...assets];
        updatedAssets[index][field] = value;
        setAssets(updatedAssets);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // Reconstruct the array back into the backend expected object dictionary map
            const assetPayload: Record<string, { working: number, notWorking: number }> = {};
            assets.forEach(a => {
                assetPayload[a.name] = { working: a.working, notWorking: a.notWorking };
            });

            // Example endpoint:
            await api.put(`/admin/common-area/${area._id}`, {
                assets: assetPayload,
            });
            toast.success(`${area.name} updated successfully`);
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            // Error toast handled globally
        } finally {
            setIsSaving(false);
        }
    };

    const getIcon = () => {
        switch (area.type) {
            case 'Washroom':
                return <Bath className="w-6 h-6 text-white" />;
            case 'Study Room':
                return <BookOpen className="w-6 h-6 text-white" />;
            default:
                return <Users className="w-6 h-6 text-white" />;
        }
    };

    const getHeaderStyle = () => {
        switch (area.type) {
            case 'Washroom':
                return 'from-cyan-500 to-blue-600';
            case 'Study Room':
                return 'from-emerald-500 to-teal-600';
            default:
                return 'from-purple-500 to-indigo-600';
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[24px] bg-white text-left align-middle shadow-2xl transition-all">

                                {/* Header */}
                                <div className={`relative bg-gradient-to-r ${getHeaderStyle()} px-8 py-6 flex items-center justify-between`}>
                                    <div className="absolute inset-0 bg-white/10 pattern-grid-lg opacity-20 pointer-events-none" />
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold leading-6 text-white flex items-center gap-3 relative z-10"
                                    >
                                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-sm">
                                            {getIcon()}
                                        </div>
                                        Manage {area.name}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors relative z-10"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="px-8 py-8 space-y-6">
                                    {/* Assets */}
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            Shared Assets Conditon
                                        </h4>
                                        {assets.length === 0 ? (
                                            <p className="text-slate-500 text-sm">No assets configured for this area.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {assets.map((asset, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <span className="font-semibold text-slate-700 capitalize w-1/3 text-lg">{asset.name}</span>
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex flex-col items-center">
                                                                <label className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Working</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={asset.working}
                                                                    onChange={(e) => handleAssetChange(idx, 'working', parseInt(e.target.value) || 0)}
                                                                    className="w-24 px-3 py-2 text-center rounded-lg border border-slate-200 font-semibold text-lg focus:border-emerald-500 outline-none"
                                                                />
                                                            </div>
                                                            <span className="text-slate-300 font-light text-2xl">|</span>
                                                            <div className="flex flex-col items-center">
                                                                <label className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1">Broken</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={asset.notWorking}
                                                                    onChange={(e) => handleAssetChange(idx, 'notWorking', parseInt(e.target.value) || 0)}
                                                                    className="w-24 px-3 py-2 text-center rounded-lg border border-slate-200 font-semibold text-lg focus:border-amber-500 outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-end gap-3 rounded-b-[24px]">
                                    <button
                                        type="button"
                                        className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 transition-colors"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.39)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleSave}
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        Save Changes
                                    </button>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

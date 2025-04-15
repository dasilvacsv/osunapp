import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  School,
  Users,
  User,
  BarChart,
  Pencil,
  Trash,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrganizationTableProps {
  data: any[];
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function OrganizationTable({
  data,
  onUpdate,
  onDelete,
}: OrganizationTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleSection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleClient = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedClients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredData = (data || []).filter((org) =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <School className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <AnimatePresence>
        <div className="space-y-4">
          {filteredData.map((org) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border rounded-xl bg-white shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleRow(org.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <School className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-medium">
                        {org.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`font-medium ${
                          org.nature === "PUBLIC"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {org.nature}
                      </Badge>
                    </div>
                  </div>
                </div>
                {expandedRows[org.id] ? (
                  <ChevronDown className="h-6 w-6 text-gray-400" />
                ) : (
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {expandedRows[org.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t"
                  >
                    <div className="p-6 space-y-6">
                      {/* Organization Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{org.contactInfo?.email || "No email provided"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{org.contactInfo?.phone || "No phone provided"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{org.address || "No address provided"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sections */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            Sections
                          </h4>
                          <Badge variant="outline" className="font-medium">
                            {org.sections?.length || 0} sections
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {org.sections?.map((section: any) => (
                            <div
                              key={section.id}
                              className="border rounded-lg bg-white shadow-sm"
                            >
                              <button
                                onClick={(e) => toggleSection(section.id, e)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                                  <div className="text-left">
                                    <h5 className="font-medium">{section.name}</h5>
                                    <span className="text-sm text-gray-500">
                                      Level: {section.level}
                                    </span>
                                  </div>
                                </div>
                                {expandedSections[section.id] ? (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                              </button>

                              <AnimatePresence>
                                {expandedSections[section.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t p-4 bg-gray-50"
                                  >
                                    <div className="space-y-2">
                                      <p>
                                        <span className="font-medium">Template Status: </span>
                                        <Badge
                                          variant={
                                            section.templateStatus === "COMPLETE"
                                              ? "success"
                                              : section.templateStatus === "INCOMPLETE"
                                              ? "destructive"
                                              : "default"
                                          }
                                        >
                                          {section.templateStatus}
                                        </Badge>
                                      </p>
                                      {section.templateLink && (
                                        <a
                                          href={section.templateLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          View Template
                                          <ChevronRight className="h-4 w-4" />
                                        </a>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clients and Beneficiaries */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-green-600" />
                            Clients & Beneficiaries
                          </h4>
                          <Badge variant="outline" className="font-medium">
                            {org.clients?.length || 0} clients
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          {org.clients?.map((client: any) => (
                            <div
                              key={client.id}
                              className="border rounded-lg bg-white shadow-sm"
                            >
                              <button
                                onClick={(e) => toggleClient(client.id, e)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                      client.deudor
                                        ? "bg-red-50 text-red-600"
                                        : "bg-green-50 text-green-600"
                                    }`}
                                  >
                                    <User className="h-5 w-5" />
                                  </div>
                                  <div className="text-left">
                                    <h5 className="font-medium">{client.name}</h5>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-500">
                                        {client.role}
                                      </span>
                                      <Badge
                                        variant={client.deudor ? "destructive" : "success"}
                                        className="text-xs"
                                      >
                                        {client.deudor ? "Deudor" : "Al día"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-medium">
                                    {client.beneficiarios?.length || 0} beneficiaries
                                  </Badge>
                                  {expandedClients[client.id] ? (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              </button>

                              <AnimatePresence>
                                {expandedClients[client.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t"
                                  >
                                    <div className="p-4 bg-gray-50">
                                      <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                          <p className="text-sm">
                                            <span className="font-medium">Document: </span>
                                            {client.document}
                                          </p>
                                          <p className="text-sm">
                                            <span className="font-medium">Phone: </span>
                                            {client.phone}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm">
                                            <span className="font-medium">WhatsApp: </span>
                                            {client.whatsapp || "-"}
                                          </p>
                                          <p className="text-sm">
                                            <span className="font-medium">Role: </span>
                                            {client.role}
                                          </p>
                                        </div>
                                      </div>

                                      {client.beneficiarios?.length > 0 && (
                                        <div className="mt-4">
                                          <h6 className="font-medium mb-3">Beneficiaries</h6>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {client.beneficiarios.map(
                                              (beneficiary: any) => (
                                                <div
                                                  key={beneficiary.id}
                                                  className="bg-white p-4 rounded-lg border"
                                                >
                                                  <div className="flex items-center gap-3 mb-2">
                                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                                      <GraduationCap className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                      <h6 className="font-medium">
                                                        {beneficiary.firstName}{" "}
                                                        {beneficiary.lastName}
                                                      </h6>
                                                      <p className="text-sm text-gray-500">
                                                        {beneficiary.grade || "No grade"} -{" "}
                                                        {beneficiary.section || "No section"}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <p>
                                                      <span className="font-medium">
                                                        Level:{" "}
                                                      </span>
                                                      {beneficiary.level || "-"}
                                                    </p>
                                                    <p>
                                                      <span className="font-medium">
                                                        School:{" "}
                                                      </span>
                                                      {beneficiary.school || "-"}
                                                    </p>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Link href={`/organizations/${org.id}/metrics`}>
                          <Button variant="outline" size="sm">
                            <BarChart className="h-4 w-4 mr-2" />
                            View Metrics
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate(org.id, org)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(org.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
"use client";
import Navbar from "@/components/nav";
import { useEffect, useState } from "react";
import { FolderOpen, FileText, ArrowLeft, Download } from "lucide-react";

const BUCKET = "grras-website-bucket";
const REGION = "ap-south-1";

export default function Home() {
  const [data, setData] = useState<{ objects: any[]; folders: string[] } | null>(null);
  const [prefix, setPrefix] = useState(""); // root level

  useEffect(() => {
    fetch(`/api/objects?prefix=${encodeURIComponent(prefix)}`)
      .then((res) => res.json())
      .then(setData);
  }, [prefix]);

  // Go up one level
  const handleBack = () => {
    if (!prefix) return;
    const parts = prefix.split("/").filter(Boolean);
    parts.pop();
    setPrefix(parts.length ? parts.join("/") + "/" : "");
  };

  // Download file handler
  const handleDownload = (key: string) => {
    window.open(`https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`, "_blank");
  };

  // Upload to current directory
  const handleRootUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    if (!fileInput.files?.length) return;
    const file = fileInput.files[0];
    const key = prefix + file.name; // upload to current directory
    const res = await fetch(`/api/upload?key=${encodeURIComponent(key)}`);
    const { url } = await res.json();
    await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    window.location.reload();
  };

  // Create folder in current directory
  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const folderInput = form.elements.namedItem("folder") as HTMLInputElement;
    if (!folderInput.value) return;
    await fetch("/api/create-folder", {
      method: "POST",
      body: JSON.stringify({ folder: prefix + folderInput.value + "/" }),
      headers: { "Content-Type": "application/json" },
    });
    window.location.reload();
  };

  // Filter out empty folder placeholder files
  const getActualFiles = (objects: any[]) => {
    if (!objects) return [];
    return objects.filter(obj => {
      // Filter out folder placeholders (objects ending with "/" and having 0 size)
      const isEmptyFolder = obj.Key.endsWith("/") && (obj.Size === 0 || obj.Size === undefined);
      const isCurrentPrefix = obj.Key === prefix; // Filter out the current folder itself
      return !isEmptyFolder && !isCurrentPrefix;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50">
      <Navbar />
      <div className="max-w-5xl mx-auto mt-12">
        <div className="rounded-2xl shadow-2xl bg-white p-12 border border-blue-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">
                Grras IT Solutions Exam Repository
              </h1>
              <p className="text-lg text-blue-700">
                Securely upload, organize, and share exams and study materials with students.
              </p>
            </div>
            <img
              src="https://grras.com/files/jevbxpfdxyuc9bevb97h/Grras%20Logo%20white%20116x98px%20-01.png"
              alt="Grras IT Solutions Logo"
              className="w-28 h-24 object-contain bg-blue-900 rounded-xl p-2"
            />
          </div>
          
          {/* Breadcrumb */}
          {prefix && (
            <div className="mb-6 text-sm text-blue-600">
              <span>Current location: /{prefix}</span>
            </div>
          )}

          <div className="mb-10 flex flex-col md:flex-row items-center gap-6">
            {/* Upload to current directory */}
            <form className="flex gap-2" onSubmit={handleRootUpload}>
              <input type="file" name="file" className="border rounded px-2 py-1" />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 transition font-semibold"
              >
                Upload File
              </button>
            </form>
            
            {/* Create folder in current directory */}
            <form className="flex gap-2" onSubmit={handleCreateFolder}>
              <input type="text" name="folder" placeholder="New folder name" className="border rounded px-2 py-1" />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition font-semibold"
              >
                Create Folder
              </button>
            </form>
            
            {prefix && (
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded bg-blue-100 text-blue-900 hover:bg-blue-200 transition font-semibold flex items-center"
                title="Go up"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
            )}
          </div>

          {!data ? (
            <div className="flex justify-center items-center h-32">
              <span className="animate-spin h-8 w-8 text-blue-400">⏳</span>
            </div>
          ) : (
            <div>
              {/* Folders */}
              {data.folders.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-blue-700 mb-4">Folders</h2>
                  <ul className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {data.folders.map((folder) => (
                      <li
                        key={folder}
                        className="flex flex-col items-center bg-blue-50 rounded-xl p-6 shadow hover:bg-blue-100 transition cursor-pointer"
                        onClick={() => setPrefix(folder)}
                      >
                        <FolderOpen className="text-blue-600 w-10 h-10 mb-2" />
                        <span className="font-medium text-blue-900 text-lg">{folder.split("/").filter(Boolean).pop()}</span>
                        <span className="text-xs text-blue-400 mt-1">View Exams</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Files - Only show actual files, not folder placeholders */}
              {(() => {
                const actualFiles = getActualFiles(data.objects);
                return actualFiles.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-blue-700 mb-4">Exams & Materials</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {actualFiles.map(file => (
                        <div key={file.Key} className="flex flex-col items-start bg-gray-50 p-4 rounded-xl shadow">
                          <FileText className="text-blue-500 w-7 h-7 mb-2" />
                          <div className="font-medium truncate mb-2" title={file.Key.split("/").pop()}>
                            {file.Key.split("/").pop()}
                          </div>
                          <div className="text-xs text-gray-500 mb-3">
                            Size: {file.Size ? (file.Size / 1024).toFixed(1) + ' KB' : 'Unknown'}
                          </div>
                          <div className="flex gap-2 mt-auto">
                            <button
                              className="px-3 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 transition flex items-center shadow-lg font-medium"
                              onClick={() => window.open(`https://${BUCKET}.s3.${REGION}.amazonaws.com/${file.Key}`, "_blank")}
                              title="View"
                            >
                              View
                            </button>
                            <button
                              className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition flex items-center shadow-lg font-medium"
                              onClick={() => handleDownload(file.Key)}
                              title="Download"
                            >
                              <Download className="w-4 h-4 mr-1" /> 
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* Empty state */}
              {data.folders.length === 0 && getActualFiles(data.objects).length === 0 && (
                <div className="text-center text-gray-500 mt-8 py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">This folder is empty</p>
                  <p className="text-sm">Upload files or create folders to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <footer className="mt-16 text-center text-blue-700 text-sm">
        &copy; {new Date().getFullYear()} Grras IT Solutions. All rights reserved.
      </footer>
    </div>
  );
}

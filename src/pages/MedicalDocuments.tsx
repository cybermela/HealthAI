
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, FileText, Trash2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  extracted_text: string | null;
  created_at: string;
}

const MedicalDocuments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadResetTime, setUploadResetTime] = useState<Date | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchDocuments();
  };

  const checkRateLimit = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('upload_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Rate limit check error:', error);
      return true;
    }

    if (!data) return true;

    const hourStart = new Date(data.hour_start);
    const now = new Date();
    const hourDiff = (now.getTime() - hourStart.getTime()) / (1000 * 60 * 60);

    if (hourDiff >= 1) {
      await supabase
        .from('upload_rate_limits')
        .update({ upload_count: 1, hour_start: now.toISOString() })
        .eq('user_id', userId);
      setUploadCount(1);
      setUploadResetTime(new Date(now.getTime() + 60 * 60 * 1000));
      return true;
    }

    if (data.upload_count >= 5) {
      const resetTime = new Date(hourStart.getTime() + 60 * 60 * 1000);
      setUploadResetTime(resetTime);
      return false;
    }

    await supabase
      .from('upload_rate_limits')
      .update({ upload_count: data.upload_count + 1 })
      .eq('user_id', userId);
    setUploadCount(data.upload_count + 1);
    return true;
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("medical_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const documentsWithUrls = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: signedUrl } = await supabase.storage
            .from('medical-documents')
            .createSignedUrl(doc.file_url, 3600);
          
          return {
            ...doc,
            file_url: signedUrl?.signedUrl || doc.file_url
          };
        })
      );
      
      setDocuments(documentsWithUrls);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const validateFileContent = async (file: File): Promise<boolean> => {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    if (file.type === 'application/pdf') {
      return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
    }
    
    if (file.type === 'image/png') {
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    }
    
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    }
    
    return false;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload documents",
        variant: "destructive",
      });
      return;
    }

    const canUpload = await checkRateLimit(session.user.id);
    if (!canUpload) {
      const resetTime = uploadResetTime?.toLocaleTimeString() || 'soon';
      toast({
        title: "Upload limit reached",
        description: `You can upload up to 5 files per hour. Try again after ${resetTime}`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF and image files (PNG, JPG) are allowed",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'image/png': ['png'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/jpg': ['jpg', 'jpeg'],
    };
    
    if (!extension || !validExtensions[file.type]?.includes(extension)) {
      toast({
        title: "File validation failed",
        description: "File extension does not match file type",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const isValidContent = await validateFileContent(file);
    if (!isValidContent) {
      toast({
        title: "Invalid file content",
        description: "File content does not match the declared file type",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const fileHash = await calculateFileHash(file);

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: existingLimit } = await supabase
        .from('upload_rate_limits')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!existingLimit) {
        await supabase
          .from('upload_rate_limits')
          .insert({
            user_id: session.user.id,
            upload_count: 1,
            hour_start: new Date().toISOString(),
          });
      }

      const { error: dbError } = await supabase
        .from("medical_documents")
        .insert({
          user_id: session.user.id,
          file_name: file.name,
          file_type: file.type,
          file_url: fileName,
          file_hash: fileHash,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      fetchDocuments();
      event.target.value = '';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    try {
      const urlParts = fileUrl.split("/medical-documents/");
      const filePath = urlParts[1]?.split('?')[0];

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("medical-documents")
          .remove([filePath]);

        if (storageError) console.error('Storage delete error:', storageError);
      }

      const { error: dbError } = await supabase
        .from("medical_documents")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Medical Documents
            </h1>
            <p className="text-muted-foreground">
              Store and manage your medical records, prescriptions, and lab reports securely
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload New Document</CardTitle>
              <CardDescription>
                Upload prescriptions, lab reports, medical records, or any health-related documents (Max 5 per hour)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG, JPEG (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Uploading document...
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Your Documents</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No documents uploaded yet. Upload your first medical document above.
                  </p>
                </CardContent>
              </Card>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{doc.file_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(doc.file_url, "_blank")}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(doc.id, doc.file_url)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalDocuments;

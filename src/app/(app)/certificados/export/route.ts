import { exportCertificadosToExcel } from "@/features/certificados/actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await exportCertificadosToExcel();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al exportar los certificados" },
        { status: 500 }
      );
    }

    // Return the download URL
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in export route:", error);
    return NextResponse.json(
      { error: "Error al exportar los certificados" },
      { status: 500 }
    );
  }
} 
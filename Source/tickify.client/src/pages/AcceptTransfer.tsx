import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apiClient from "../services/apiClient";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface AcceptTransferProps {
  onNavigate: (page: string, id?: string) => void;
}

export function AcceptTransfer({ onNavigate }: AcceptTransferProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [ticketCode, setTicketCode] = useState("");

  useEffect(() => {
    const acceptTransfer = async () => {
      const transferId = searchParams.get("transferId");
      const token = searchParams.get("token");

      if (!transferId || !token) {
        setStatus("error");
        setMessage(t("transfer.accept.invalidLink"));
        return;
      }

      // Check if user is logged in
      const tokenValue =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!tokenValue) {
        // Save the return URL so we can come back after login
        const returnUrl = `/tickets/accept-transfer?transferId=${transferId}&token=${encodeURIComponent(
          token
        )}`;
        sessionStorage.setItem("returnUrl", returnUrl);

        setStatus("error");
        setMessage(
          t("transfer.accept.reasonLogin") ||
            "You need to login first to accept this transfer"
        );
        toast.info(t("transfer.accept.reasonLogin"));

        // Auto redirect to login after 2 seconds
        setTimeout(() => {
          onNavigate("login");
        }, 2000);
        return;
      }

      try {
        // Call the API to accept the transfer using apiClient
        const response = await apiClient.get(
          `/tickets/transfers/accept?transferId=${transferId}&token=${encodeURIComponent(
            token
          )}`
        );

        setStatus("success");
        setTicketCode(
          response.data?.data?.ticketNumber ||
            response.data?.data?.ticketCode ||
            ""
        );
        setMessage(
          response.data?.message ||
            t("transfer.accept.success") ||
            "Ticket transfer accepted successfully!"
        );
        toast.success(t("transfer.accept.success"));

        // Trigger reload in MyTickets page
        window.dispatchEvent(new Event("tickets-updated"));
      } catch (error: unknown) {
        // Handle 401 Unauthorized
        const err = error as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };

        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("token"); // Also remove old key if exists
          const returnUrl = `/tickets/accept-transfer?transferId=${transferId}&token=${encodeURIComponent(
            token
          )}`;
          sessionStorage.setItem("returnUrl", returnUrl);

          setStatus("error");
          setMessage(
            t("transfer.accept.reasonLogin") ||
              "Your session has expired. Please login again."
          );
          toast.error(t("transfer.accept.reasonLogin"));

          setTimeout(() => {
            onNavigate("login");
          }, 2000);
          return;
        }

        if (err.response?.status === 403) {
          setStatus("error");
          setMessage(
            err.response?.data?.message ||
              t("transfer.accept.reasonWrongAccount") ||
              "This transfer was sent to a different email address. Please login with the correct account."
          );
          toast.error(
            t("transfer.accept.reasonWrongAccount") ||
              "Wrong account - please login with the recipient email"
          );
          return;
        }

        // Handle other errors
        setStatus("error");
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          t("transfer.accept.error") ||
          "Failed to accept transfer";
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    acceptTransfer();
  }, [searchParams, t, onNavigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t("transfer.accept.processing") || "Processing Transfer..."}
            </h2>
            <p className="text-gray-600">
              {t("transfer.accept.pleaseWait") || "Please wait a moment..."}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t("transfer.accept.successTitle") || "Transfer Accepted!"}
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            {ticketCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">
                  {t("transfer.accept.ticketCode") || "Ticket Code"}
                </p>
                <p className="text-xl font-bold text-blue-600">{ticketCode}</p>
              </div>
            )}
            <button
              onClick={() => onNavigate("my-tickets")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {t("transfer.accept.viewTickets") || "View My Tickets"}
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t("transfer.accept.errorTitle") || "Transfer Failed"}
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {t("transfer.accept.possibleReasons") || "Possible reasons:"}
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    •{" "}
                    {t("transfer.accept.reasonExpired") ||
                      "Transfer link has expired"}
                  </li>
                  <li>
                    •{" "}
                    {t("transfer.accept.reasonAlready") ||
                      "Transfer already accepted"}
                  </li>
                  <li>
                    •{" "}
                    {t("transfer.accept.reasonLogin") ||
                      "You need to login first"}
                  </li>
                  <li>
                    •{" "}
                    {t("transfer.accept.reasonWrongAccount") ||
                      "Wrong account - transfer was sent to different email"}
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate("login")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {t("transfer.accept.login") || "Login"}
              </button>
              <button
                onClick={() => onNavigate("home")}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {t("transfer.accept.goHome") || "Go Home"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

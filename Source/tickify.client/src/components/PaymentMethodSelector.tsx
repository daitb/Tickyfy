import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Wallet,
  Check,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  validateMomoPhone,
  validateCardNumber,
  validateCardExpiry,
  validateCVV,
  validateCardholderName,
  formatCardNumber,
  formatExpiryDate,
  formatPhoneNumber,
} from "../utils/validation";

interface PaymentMethodDetails {
  phone?: string;
  number?: string;
  name?: string;
  expiry?: string;
  cvv?: string;
}

interface PaymentMethodSelectorProps {
  onPaymentMethodChange: (
    method: PaymentMethod,
    details?: Record<string, unknown>
  ) => void;
  selectedMethod?: PaymentMethod;
}

export type PaymentMethod = "momo" | "vnpay" | "credit-card";

export function PaymentMethodSelector({
  onPaymentMethodChange,
  selectedMethod,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const initialMethod = selectedMethod || "momo";
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [momoPhone, setMomoPhone] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<{
    momoPhone?: string;
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
  }>({});
  const [touched, setTouched] = useState<{
    momoPhone: boolean;
    cardNumber: boolean;
    cardName: boolean;
    cardExpiry: boolean;
    cardCvv: boolean;
  }>({
    momoPhone: false,
    cardNumber: false,
    cardName: false,
    cardExpiry: false,
    cardCvv: false,
  });

  const handleMethodChange = (newMethod: PaymentMethod) => {
    setMethod(newMethod);
    setErrors({});
    setTouched({
      momoPhone: false,
      cardNumber: false,
      cardName: false,
      cardExpiry: false,
      cardCvv: false,
    });
    onPaymentMethodChange(newMethod);
  };

  const validateMomoPhoneField = (phone: string) => {
    if (!touched.momoPhone) return;
    const validation = validateMomoPhone(phone);
    if (!validation.isValid) {
      setErrors({ ...errors, momoPhone: validation.error });
    } else {
      const newErrors = { ...errors };
      delete newErrors.momoPhone;
      setErrors(newErrors);
    }
  };

  const validateCardField = (field: string, value: string) => {
    const fieldTouched = touched[field as keyof typeof touched];
    if (!fieldTouched) return;

    let validation: { isValid: boolean; error?: string } = { isValid: true };

    switch (field) {
      case "cardNumber":
        validation = validateCardNumber(value);
        break;
      case "cardName":
        validation = validateCardholderName(value);
        break;
      case "cardExpiry":
        validation = validateCardExpiry(value);
        break;
      case "cardCvv":
        validation = validateCVV(value);
        break;
    }

    if (!validation.isValid) {
      setErrors({ ...errors, [field]: validation.error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[field as keyof typeof newErrors];
      setErrors(newErrors);
    }
  };

  const handleMomoPhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setMomoPhone(formatted);
    validateMomoPhoneField(formatted);
    onPaymentMethodChange("momo", { phone: formatted });
  };

  const handleMomoPhoneBlur = () => {
    setTouched({ ...touched, momoPhone: true });
    validateMomoPhoneField(momoPhone);
  };

  const handleCardChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === "number") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiry") {
      formattedValue = formatExpiryDate(value);
    } else if (field === "name") {
      formattedValue = value.toUpperCase();
    }

    const updated = { ...cardDetails, [field]: formattedValue };
    setCardDetails(updated);
    validateCardField(
      field === "number"
        ? "cardNumber"
        : field === "name"
        ? "cardName"
        : field === "expiry"
        ? "cardExpiry"
        : "cardCvv",
      formattedValue
    );
    onPaymentMethodChange("credit-card", updated);
  };

  const handleCardBlur = (field: string) => {
    const touchedField =
      field === "number"
        ? "cardNumber"
        : field === "name"
        ? "cardName"
        : field === "expiry"
        ? "cardExpiry"
        : "cardCvv";
    setTouched({ ...touched, [touchedField]: true });
    const value = cardDetails[field as keyof typeof cardDetails];
    validateCardField(touchedField, value);
  };

  useEffect(() => {
    if (method === "momo" && momoPhone && touched.momoPhone) {
      validateMomoPhoneField(momoPhone);
    }
    if (method === "credit-card") {
      if (cardDetails.number && touched.cardNumber)
        validateCardField("cardNumber", cardDetails.number);
      if (cardDetails.name && touched.cardName)
        validateCardField("cardName", cardDetails.name);
      if (cardDetails.expiry && touched.cardExpiry)
        validateCardField("cardExpiry", cardDetails.expiry);
      if (cardDetails.cvv && touched.cardCvv)
        validateCardField("cardCvv", cardDetails.cvv);
    }
  }, [method, momoPhone, cardDetails, touched]);

  const paymentMethods = [
    {
      id: "momo" as PaymentMethod,
      name: t("payment.methods.momoWallet"),
      icon: Wallet,
      description: t("payment.methods.momoDescription"),
      color: "bg-pink-500",
      popular: true,
    },
    {
      id: "vnpay" as PaymentMethod,
      name: t("payment.methods.vnpay"),
      icon: Smartphone,
      description: t("payment.methods.vnpayDescription"),
      color: "bg-blue-500",
      popular: true,
    },
    {
      id: "credit-card" as PaymentMethod,
      name: t("payment.methods.creditCard"),
      icon: CreditCard,
      description: t("payment.methods.creditCardDescription"),
      color: "bg-teal-500",
      popular: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-6">{t("payment.selectMethod")}</h3>

        <RadioGroup
          value={method}
          onValueChange={(value) => handleMethodChange(value as PaymentMethod)}
        >
          <div className="space-y-3">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              const isSelected = method === pm.id;

              return (
                <label
                  key={pm.id}
                  className={`relative flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "border-teal-500 bg-teal-50"
                      : "border-neutral-200 hover:border-teal-300 hover:bg-neutral-50"
                  }`}
                >
                  <RadioGroupItem value={pm.id} id={pm.id} className="mt-1" />

                  <div className={`${pm.color} p-3 rounded-lg text-white`}>
                    <Icon size={24} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-neutral-900">{pm.name}</span>
                      {pm.popular && (
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                          {t("payment.popular")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">{pm.description}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-teal-500 rounded-full p-1">
                      <Check className="text-white" size={16} />
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Payment Details Forms */}
      <div className="pt-4">
        {method === "momo" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
              <h4 className="mb-2 text-pink-900">
                {t("payment.momo.howToPay")}
              </h4>
              <ol className="text-sm text-pink-800 space-y-1.5 list-decimal list-inside">
                <li>{t("payment.momo.step1")}</li>
                <li>{t("payment.momo.step2")}</li>
                <li>{t("payment.momo.step3")}</li>
                <li>{t("payment.momo.step4")}</li>
              </ol>
            </div>

            <div>
              <Label htmlFor="momo-phone">
                {t("payment.momo.phoneNumber")}
              </Label>
              <Input
                id="momo-phone"
                type="tel"
                placeholder="09xx xxx xxx"
                value={momoPhone}
                onChange={(e) => handleMomoPhoneChange(e.target.value)}
                onBlur={handleMomoPhoneBlur}
                className={`mt-2 ${
                  touched.momoPhone && errors.momoPhone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : touched.momoPhone && !errors.momoPhone && momoPhone
                    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                    : ""
                }`}
              />
              {touched.momoPhone && errors.momoPhone && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                  <AlertCircle size={14} />
                  <span>{errors.momoPhone}</span>
                </div>
              )}
              {touched.momoPhone && !errors.momoPhone && momoPhone && (
                <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                  <Check size={14} />
                  <span>{t("payment.momo.validPhone")}</span>
                </div>
              )}
              {!touched.momoPhone && (
                <p className="text-xs text-neutral-500 mt-2">
                  {t("payment.momo.phoneNote")}
                </p>
              )}
            </div>
          </div>
        )}

        {method === "vnpay" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="mb-2 text-blue-900">
                {t("payment.vnpay.howToPay")}
              </h4>
              <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>{t("payment.vnpay.step1")}</li>
                <li>{t("payment.vnpay.step2")}</li>
                <li>{t("payment.vnpay.step3")}</li>
                <li>{t("payment.vnpay.step4")}</li>
              </ol>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <h5 className="text-sm mb-3 text-neutral-700">
                {t("payment.vnpay.supportedBanks")}
              </h5>
              <div className="grid grid-cols-3 gap-3">
                {[
                  "vietcombank",
                  "techcombank",
                  "vietinbank",
                  "bidv",
                  "acb",
                  "mbbank",
                  "vpbank",
                  "tpbank",
                  "agribank",
                ].map((bank) => (
                  <div
                    key={bank}
                    className="text-xs text-center p-2 bg-neutral-50 rounded border border-neutral-200"
                  >
                    {t(`payment.vnpay.banks.${bank}`)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-600 mt-3">
                {t("payment.vnpay.banksNote")}
              </p>
            </div>
          </div>
        )}

        {method === "credit-card" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <h4 className="mb-2 text-teal-900">
                {t("payment.creditCard.securePayment")}
              </h4>
              <p className="text-sm text-teal-800">
                {t("payment.creditCard.instructions")}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="card-number">
                  {t("payment.creditCard.cardNumber")}
                </Label>
                <Input
                  id="card-number"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => handleCardChange("number", e.target.value)}
                  onBlur={() => handleCardBlur("number")}
                  maxLength={19}
                  className={`mt-2 ${
                    touched.cardNumber && errors.cardNumber
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : touched.cardNumber &&
                        !errors.cardNumber &&
                        cardDetails.number
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                />
                {touched.cardNumber && errors.cardNumber && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                    <AlertCircle size={14} />
                    <span>{errors.cardNumber}</span>
                  </div>
                )}
                {touched.cardNumber &&
                  !errors.cardNumber &&
                  cardDetails.number && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <Check size={14} />
                      <span>{t("payment.creditCard.validCardNumber")}</span>
                    </div>
                  )}
              </div>

              <div>
                <Label htmlFor="card-name">
                  {t("payment.creditCard.cardholderName")}
                </Label>
                <Input
                  id="card-name"
                  type="text"
                  placeholder="NGUYEN VAN A"
                  value={cardDetails.name}
                  onChange={(e) => handleCardChange("name", e.target.value)}
                  onBlur={() => handleCardBlur("name")}
                  className={`mt-2 ${
                    touched.cardName && errors.cardName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : touched.cardName && !errors.cardName && cardDetails.name
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                />
                {touched.cardName && errors.cardName && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                    <AlertCircle size={14} />
                    <span>{errors.cardName}</span>
                  </div>
                )}
                {touched.cardName && !errors.cardName && cardDetails.name && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                    <Check size={14} />
                    <span>{t("payment.creditCard.validCardholderName")}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-expiry">
                    {t("payment.creditCard.expiryDate")}
                  </Label>
                  <Input
                    id="card-expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => handleCardChange("expiry", e.target.value)}
                    onBlur={() => handleCardBlur("expiry")}
                    maxLength={5}
                    className={`mt-2 ${
                      touched.cardExpiry && errors.cardExpiry
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : touched.cardExpiry &&
                          !errors.cardExpiry &&
                          cardDetails.expiry
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                  />
                  {touched.cardExpiry && errors.cardExpiry && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle size={14} />
                      <span>{errors.cardExpiry}</span>
                    </div>
                  )}
                  {touched.cardExpiry &&
                    !errors.cardExpiry &&
                    cardDetails.expiry && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                        <Check size={14} />
                        <span>{t("payment.creditCard.valid")}</span>
                      </div>
                    )}
                </div>
                <div>
                  <Label htmlFor="card-cvv">
                    {t("payment.creditCard.cvv")}
                  </Label>
                  <Input
                    id="card-cvv"
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardChange("cvv", e.target.value)}
                    onBlur={() => handleCardBlur("cvv")}
                    maxLength={4}
                    className={`mt-2 ${
                      touched.cardCvv && errors.cardCvv
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : touched.cardCvv && !errors.cardCvv && cardDetails.cvv
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                  />
                  {touched.cardCvv && errors.cardCvv && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle size={14} />
                      <span>{errors.cardCvv}</span>
                    </div>
                  )}
                  {touched.cardCvv && !errors.cardCvv && cardDetails.cvv && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <Check size={14} />
                      <span>{t("payment.creditCard.valid")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {["Visa", "Mastercard", "JCB"].map((card) => (
                  <div
                    key={card}
                    className="flex-1 text-xs text-center py-2 bg-neutral-100 rounded border border-neutral-200"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

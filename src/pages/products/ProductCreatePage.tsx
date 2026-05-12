import {
  type ComponentProps,
  useMemo,
  useState,
} from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  checkProductImei,
  useCreateProduct,
  useProductCreateOptions,
} from "@/entities/products/api/use-product-create";
import { useCreateWallet } from "@/entities/catalogs/api/use-catalogs";
import { getApiErrorMessage } from "@/shared/api/error";
import { ApiError } from "@/shared/api/http";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { AppFileUpload } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { PageHeader } from "@/shared/ui/page-header";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import {
  Field,
  InfoBox,
  InlineCreate,
  RegistrationCheckboxGroup,
  SummaryRow,
} from "@/features/products/product-form/FormPrimitives";
import {
  getPaymentMethod,
  getProductFormErrorMessage,
  type PurchaseScenario,
  scenarioMeta,
} from "@/features/products/product-form/model";

export function ProductCreatePage() {
  const navigate = useNavigate();
  const optionsQuery = useProductCreateOptions();
  const createMutation = useCreateProduct();
  const createWalletMutation = useCreateWallet();

  const [scenario, setScenario] = useState<PurchaseScenario>("supplier_debt");
  const [name, setName] = useState("");
  const [imei, setImei] = useState("");
  const [imei2, setImei2] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [paymentWalletId, setPaymentWalletId] = useState("");
  const [newPaymentWalletName, setNewPaymentWalletName] = useState("");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [primarySplitAmount, setPrimarySplitAmount] = useState("");
  const [splitWalletId, setSplitWalletId] = useState("");
  const [newSplitWalletName, setNewSplitWalletName] = useState("");
  const [registrationStatuses, setRegistrationStatuses] = useState<string[]>(
    [],
  );
  const [photos, setPhotos] = useState<File[]>([]);
  const [imeiError, setImeiError] = useState("");
  const [checkingImei, setCheckingImei] = useState(false);

  const options = optionsQuery.data;
  const buyPriceNumber = Number(buyPrice || 0);
  const primarySplitNumber = Number(primarySplitAmount || 0);
  const secondarySplitAmount = splitEnabled
    ? Math.max(buyPriceNumber - primarySplitNumber, 0)
    : 0;
  const splitAmountInvalid =
    splitEnabled &&
    (primarySplitNumber <= 0 || primarySplitNumber >= buyPriceNumber);

  const visibleSplitWalletOptions = useMemo(() => {
    const allOptions = options?.split_wallet_options ?? [];
    return allOptions.filter((option) => {
      if (scenario === "cash_now" && option.type === "cash") return false;
      if (scenario === "cash_now" && option.id === options?.cash_wallet_id)
        return false;
      if (scenario === "transfer_now" && option.id === paymentWalletId)
        return false;
      return true;
    });
  }, [options, paymentWalletId, scenario]);

  function handleScenarioChange(value: string) {
    const next = value as PurchaseScenario;
    setScenario(next);
    if (next !== "transfer_now") setPaymentWalletId("");
    if (next === "supplier_debt") {
      setSplitEnabled(false);
      setSplitWalletId("");
      setPrimarySplitAmount("");
    }
  }

  async function handleImeiBlur() {
    const normalizedImei = imei.trim();
    setImeiError("");
    if (!normalizedImei) return;
    setCheckingImei(true);
    try {
      const result = await checkProductImei(normalizedImei);
      if (result.exists) setImeiError("Товар с таким IMEI уже существует");
    } finally {
      setCheckingImei(false);
    }
  }

  function isFormValid() {
    return (
      !imeiError &&
      !splitAmountInvalid &&
      !!supplierId &&
      (scenario !== "transfer_now" || !!paymentWalletId) &&
      (!splitEnabled || !!splitWalletId)
    );
  }

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = (
    event,
  ) => {
    event.preventDefault();
    if (!isFormValid()) return;

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("imei", imei.trim());
    formData.append("buy_price", buyPrice);
    formData.append("supplier_id", supplierId);
    formData.append("payment_method", getPaymentMethod(scenario));

    if (imei2.trim()) formData.append("imei2", imei2.trim());
    if (phoneNumber.trim()) formData.append("phone_number", phoneNumber.trim());
    if (scenario === "transfer_now")
      formData.append("wallet_id", paymentWalletId);

    if (splitEnabled) {
      formData.append("split_payment_enabled", "on");
      formData.append("split_payment_amount", secondarySplitAmount.toFixed(2));
      formData.append("split_payment_wallet_id", splitWalletId);
    }

    registrationStatuses.forEach((status) => formData.append("status", status));
    photos.forEach((photo) => formData.append("photos", photo));

    createMutation.mutate(formData, {
      onSuccess: (product) => {
        toast.success("Товар добавлен");
        navigate(`/products/${product.id}`, { replace: true });
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, "Не удалось создать закупку")),
    });
  };

  const error =
    createMutation.error instanceof ApiError
      ? getProductFormErrorMessage(
          createMutation.error.payload,
          "Не удалось создать закупку. Попробуйте ещё раз.",
        )
      : null;

  function createInlineWallet(
    name: string,
    walletType: string,
    onCreated: (id: string) => void,
  ) {
    const trimmed = name.trim();
    if (!trimmed) return;
    createWalletMutation.mutate(
      { name: trimmed, wallet_type: walletType },
      {
        onSuccess: (wallet) => {
          onCreated(String(wallet.id));
          optionsQuery.refetch();
          toast.success("Кошелёк создан");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  if (optionsQuery.isLoading) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Загружаем форму закупки...
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Новая закупка"
        description="Выберите сценарий оплаты, добавьте товар и привяжите финансовое движение."
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="space-y-4">
          {error ? (
            <Alert className="rounded-lg border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle aria-hidden="true" />
              <AlertDescription className="font-semibold text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Scenario */}
          <Card>
            <CardHeader>
              <CardTitle>Как прошла оплата?</CardTitle>
              <CardDescription>
                От сценария зависит, какой кошелек или долг будет затронут.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={scenario}
                onValueChange={handleScenarioChange}
                className="grid grid-cols-1 gap-3 md:grid-cols-3"
              >
                {(Object.keys(scenarioMeta) as PurchaseScenario[]).map(
                  (value) => {
                    const meta = scenarioMeta[value];
                    const selected = scenario === value;
                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-all ${
                          selected
                            ? "border-primary bg-sky-50 ring-2 ring-primary/10"
                            : "border-border bg-background hover:border-muted-foreground/40"
                        }`}
                      >
                        <RadioGroupItem value={value} className="mt-0.5" />
                        <span>
                          <span className="block text-[13px] font-bold leading-5 text-foreground">
                            {meta.title}
                          </span>
                          <span className="mt-1 block text-[13px] leading-5 text-gray-500">
                            {meta.description}
                          </span>
                        </span>
                      </label>
                    );
                  },
                )}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Product */}
          <Card>
            <CardHeader>
              <CardTitle>Товар</CardTitle>
              <CardDescription>Основные данные товара и IMEI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Название / Модель">
                <Input
                  required
                  placeholder="iPhone 13..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="IMEI / Серийный номер">
                  <Input
                    required
                    placeholder="35..."
                    className={`font-mono ${
                      imeiError
                        ? "border-red-300 bg-red-50 focus-visible:ring-red-500/20"
                        : ""
                    }`}
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    onBlur={handleImeiBlur}
                  />
                  {imeiError ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {imeiError}
                    </p>
                  ) : checkingImei ? (
                    <p className="mt-1 text-[13px] font-medium leading-5 text-gray-500">
                      Проверяем IMEI...
                    </p>
                  ) : null}
                </Field>

                <Field label="IMEI 2">
                  <Input
                    placeholder="Необязательно"
                    className="font-mono"
                    value={imei2}
                    onChange={(e) => setImei2(e.target.value)}
                  />
                </Field>

                <Field label="Номер телефона">
                  <Input
                    type="tel"
                    placeholder="+994..."
                    className="font-mono"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </Field>

                <Field label="Цена закупки (AZN)">
                  <Input
                    required
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    className="font-bold"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card>
            <CardHeader>
              <CardTitle>Регистрация</CardTitle>
              <CardDescription>
                Отметьте статусы, которые относятся к товару.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationCheckboxGroup
                value={registrationStatuses}
                onChange={setRegistrationStatuses}
              />
            </CardContent>
          </Card>

          {/* Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Фото</CardTitle>
              <CardDescription>Фото товара или чека.</CardDescription>
            </CardHeader>
            <CardContent>
              <AppFileUpload
                value={photos}
                onChange={(files) => setPhotos(Array.isArray(files) ? files : [])}
                multiple
                accept="image/*"
                label="Загрузить фото товара"
              />
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Оплата</CardTitle>
              <CardDescription>
                Поставщик, кошелек оплаты и сплит-платеж.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="У кого покупаем?" strong>
                <SearchableSelect
                  value={supplierId}
                  onValueChange={setSupplierId}
                  options={options?.supplier_wallet_options ?? []}
                  placeholder="Выберите поставщика или партнёра"
                  searchPlaceholder="Поиск поставщика..."
                />
                <InlineCreate
                  value={newSupplierName}
                  onChange={setNewSupplierName}
                  onCreate={() =>
                    createInlineWallet(newSupplierName, "debt_supplier", (id) => {
                      setSupplierId(id);
                      setNewSupplierName("");
                    })
                  }
                  placeholder="Новый поставщик"
                />
              </Field>

              {scenario === "supplier_debt" ? (
                <InfoBox color="red" title="Оплата сейчас не списывается.">
                  Система создаст закупку и запишет сумму в долг поставщику.
                </InfoBox>
              ) : null}

              {scenario === "cash_now" ? (
                <InfoBox color="green" title="Основная сумма уйдёт из кассы.">
                  Если включить сплит, остаток останется за кассой, а вторая
                  сумма уйдёт из другого кошелька.
                </InfoBox>
              ) : null}

              {scenario === "transfer_now" ? (
                <div className="space-y-4 rounded-lg border border-sky-200 bg-background p-4">
                  <Field label="Основной счёт или карта" strong>
                    <SearchableSelect
                      value={paymentWalletId}
                      onValueChange={setPaymentWalletId}
                      options={options?.payment_wallet_options ?? []}
                      placeholder="Выберите карту или счёт"
                      searchPlaceholder="Поиск счёта или карты..."
                    />
                    <InlineCreate
                      value={newPaymentWalletName}
                      onChange={setNewPaymentWalletName}
                      onCreate={() =>
                        createInlineWallet(newPaymentWalletName, "card", (id) => {
                          setPaymentWalletId(id);
                          setNewPaymentWalletName("");
                        })
                      }
                      placeholder="Новая карта / счёт"
                    />
                  </Field>
                </div>
              ) : null}

              {scenario !== "supplier_debt" ? (
                <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={splitEnabled}
                      onCheckedChange={(checked) =>
                        setSplitEnabled(Boolean(checked))
                      }
                      className="mt-1 size-5"
                    />
                    <span>
                      <span className="block text-[13px] font-bold leading-5 text-foreground">
                        Сплит-платёж
                      </span>
                      <span className="mt-1 block text-[13px] leading-5 text-gray-500">
                        Часть суммы списать из второго кошелька.
                      </span>
                    </span>
                  </label>

                  {splitEnabled ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field
                          label={
                            scenario === "cash_now"
                              ? "Сумма из кассы"
                              : "Сумма с основного счёта"
                          }
                          strong
                        >
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-muted-foreground">
                              ₼
                            </span>
                            <Input
                              required
                              type="number"
                              step="1"
                              min="1"
                              placeholder="0"
                              className={`pl-7 font-bold ${
                                splitAmountInvalid
                                  ? "border-red-300 bg-red-50 focus-visible:ring-red-500/20"
                                  : "border-sky-200 bg-background"
                              }`}
                              value={primarySplitAmount}
                              onChange={(e) =>
                                setPrimarySplitAmount(e.target.value)
                              }
                            />
                          </div>
                          {splitAmountInvalid ? (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                              Сумма должна быть больше 0 и меньше цены закупки
                            </p>
                          ) : null}
                        </Field>

                        <Field label="Сумма со второго кошелька" strong>
                          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 font-bold text-sky-700">
                            {secondarySplitAmount.toFixed(2)} ₼
                          </div>
                        </Field>
                      </div>

                      <Field label="Второй кошелёк для сплит-платежа" strong>
                        <SearchableSelect
                          value={splitWalletId}
                          onValueChange={setSplitWalletId}
                          options={visibleSplitWalletOptions}
                          placeholder="Выберите второй кошелёк"
                          searchPlaceholder="Поиск кошелька..."
                        />
                        <InlineCreate
                          value={newSplitWalletName}
                          onChange={setNewSplitWalletName}
                          onCreate={() =>
                            createInlineWallet(newSplitWalletName, "card", (id) => {
                              setSplitWalletId(id);
                              setNewSplitWalletName("");
                            })
                          }
                          placeholder="Новый кошелёк"
                        />
                      </Field>
                    </>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Итог</CardTitle>
              <CardDescription>Проверьте перед созданием.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow
                label="Как прошла оплата?"
                value={scenarioMeta[scenario].title}
              />
              <SummaryRow
                label="Цена закупки"
                value={buyPrice ? `${buyPrice} ₼` : "-"}
              />
              <SummaryRow
                label="Сплит"
                value={
                  splitEnabled ? `${secondarySplitAmount.toFixed(2)} ₼` : "Нет"
                }
              />
              <Button
                type="submit"
                disabled={createMutation.isPending || !isFormValid()}
                className="mt-2 w-full py-4"
              >
                {createMutation.isPending ? "Создаём..." : "Создать закупку"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </section>
  );
}

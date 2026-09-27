const T = {
  en: {
    title: "WhatsApp setup",
    subtitle: "Connect and verify a WhatsApp number, then choose a package.",
    steps: { numbers: "Number", verification: "Verification", package: "Package" },
    common: { back: "Back", next: "Continue", retry: "Retry", loading: "Loading…", error: "Something went wrong. Please try again." },
    numbers: {
      title: "WhatsApp numbers", addNumber: "Add a number", editNumber: "Edit number", editingPhone: "Editing phone", save: "Add number", saveChanges: "Save changes", cancel: "Cancel",
      phone: "Phone number", verifiedName: "Verified name", androidLink: "Android link", iosLink: "iOS link", websiteUrl: "Website URL",
      aiContext: "AI context", aiFile: "AI file", autoRequest: "Request a verification code after adding", codeMethod: "Code delivery",
      sms: "SMS", voice: "Voice call", noNumbers: "No WhatsApp numbers yet.", verified: "Verified", unverified: "Not verified",
      edit: "Edit number", delete: "Delete number", confirmDelete: "Delete this WhatsApp number?", addSuccess: "WhatsApp number added.",
      editSuccess: "WhatsApp number updated.", deleteSuccess: "WhatsApp number deleted.", error: "Could not save the WhatsApp number.",
      loadError: "Could not load WhatsApp numbers.", loading: "Loading WhatsApp numbers…", retry: "Retry",
    },
    verification: {
      title: "Verify your numbers", verified: "Verified", unverified: "Not verified", requestCode: "Send code", resendCode: "Resend code",
      codeMethod: "Delivery method", sms: "SMS", voice: "Voice call", code: "Verification code", pin: "Two-step PIN",
      verify: "Verify and register", sync: "Sync Meta status", syncing: "Syncing…", codeSent: "Verification code requested.",
      verifiedSuccess: "Number verified and registered.", syncSuccess: "Meta status synced.", requestError: "Could not request verification code.",
      noNumbers: "Add a WhatsApp number in the first step.", noCodeRequested: "Request a code before entering verification details.",
      loading: "Loading WhatsApp numbers…", error: "Could not complete verification.",
    },
    package: {
      title: "Choose a WhatsApp package", chooseNumber: "Verified number", choosePackage: "Package", order: "Place package order",
      aiFile: "AI file for this order", noNumbers: "Verify a number before ordering.", noPackages: "No WhatsApp packages available.",
      messages: "messages", months: "months", success: "Package order submitted.", error: "Could not submit the package order.",
      loading: "Loading WhatsApp packages…",
    },
  },
  ar: {
    title: "إعداد واتساب",
    subtitle: "أضف رقم واتساب وتحقق منه، ثم اختر الباقة المناسبة.",
    steps: { numbers: "الرقم", verification: "التحقق", package: "الباقة" },
    common: { back: "رجوع", next: "متابعة", retry: "إعادة المحاولة", loading: "جاري التحميل…", error: "حدث خطأ. حاول مرة أخرى." },
    numbers: {
      title: "أرقام واتساب", addNumber: "إضافة رقم", editNumber: "تعديل الرقم", editingPhone: "تعديل بيانات الرقم", save: "إضافة الرقم", saveChanges: "حفظ التعديلات", cancel: "إلغاء",
      phone: "رقم الهاتف", verifiedName: "الاسم المعتمد", androidLink: "رابط أندرويد", iosLink: "رابط iOS", websiteUrl: "رابط الموقع",
      aiContext: "سياق الذكاء الاصطناعي", aiFile: "ملف الذكاء الاصطناعي", autoRequest: "طلب كود التحقق بعد إضافة الرقم", codeMethod: "طريقة إرسال الكود",
      sms: "رسالة نصية", voice: "مكالمة صوتية", noNumbers: "لا توجد أرقام واتساب بعد.", verified: "تم التحقق", unverified: "لم يتم التحقق",
      edit: "تعديل الرقم", delete: "حذف الرقم", confirmDelete: "هل تريد حذف رقم واتساب هذا؟", addSuccess: "تمت إضافة رقم واتساب.",
      editSuccess: "تم تحديث رقم واتساب.", deleteSuccess: "تم حذف رقم واتساب.", error: "تعذر حفظ رقم واتساب.",
      loadError: "تعذر تحميل أرقام واتساب.", loading: "جاري تحميل أرقام واتساب…", retry: "إعادة المحاولة",
    },
    verification: {
      title: "التحقق من أرقامك", verified: "تم التحقق", unverified: "لم يتم التحقق", requestCode: "إرسال الكود", resendCode: "إعادة إرسال الكود",
      codeMethod: "طريقة الإرسال", sms: "رسالة نصية", voice: "مكالمة صوتية", code: "كود التحقق", pin: "رمز PIN للتحقق بخطوتين",
      verify: "تحقق وسجّل الرقم", sync: "مزامنة حالة Meta", syncing: "جاري المزامنة…", codeSent: "تم طلب كود التحقق.",
      verifiedSuccess: "تم التحقق من الرقم وتسجيله.", syncSuccess: "تمت مزامنة حالة Meta.", requestError: "تعذر طلب كود التحقق.",
      noNumbers: "أضف رقم واتساب في الخطوة الأولى.", noCodeRequested: "اطلب كود التحقق أولاً.",
      loading: "جاري تحميل أرقام واتساب…", error: "تعذر إكمال التحقق.",
    },
    package: {
      title: "اختيار باقة واتساب", chooseNumber: "الرقم المتحقق منه", choosePackage: "الباقة", order: "إرسال طلب الباقة",
      aiFile: "ملف الذكاء الاصطناعي للطلب", noNumbers: "تحقق من رقم واتساب قبل طلب الباقة.", noPackages: "لا توجد باقات واتساب متاحة.",
      messages: "رسالة", months: "أشهر", success: "تم إرسال طلب الباقة.", error: "تعذر إرسال طلب الباقة.",
      loading: "جاري تحميل باقات واتساب…",
    },
  },
};

export default T;

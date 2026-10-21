/**
 * i18n.js - Routario Bilingual (English / Persian) & RTL Engine
 * Provides client-side localization, local Vazirmatn font integration,
 * dynamic RTL/LTR switching, and automated DOM mutation translation.
 */

(function () {
    const translations = {
        en: {
            app_name: "Routario",
            language: "Language",
            lang_en: "English",
            lang_fa: "فارسی",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            create: "Create",
            add: "Add",
            search: "Search",
            filter: "Filter",
            refresh: "Refresh",
            close: "Close",
            confirm: "Confirm",
            actions: "Actions",
            status: "Status",
            name: "Name",
            description: "Description",
            type: "Type",
            details: "Details",
            loading: "Loading…",
            no_data: "No data available",
            all: "All",
            online: "Online",
            offline: "Offline",
            unknown: "Unknown",
            moving: "Moving",
            stopped: "Stopped",
            idle: "Idle",
            clear_cache: "Clear Cache",
            logout: "Sign Out",
            profile: "Profile",

            // Navigation & Header
            dashboard: "Dashboard",
            management: "Management",
            fleet_reports: "Fleet Reports",
            user_settings: "User Settings",
            voice_ptt: "Voice PTT",
            routes: "Routes",
            ai_copilot: "AI Copilot",
            super_admin: "Super Admin",
            company_admin: "Company Admin",
            user_role: "User",

            // Dashboard Sidebar Tabs
            tab_devices: "Devices",
            tab_geofences: "Geofences",
            tab_history: "History",
            tab_sensors: "Sensors",
            tab_logbook: "Logbook",
            tab_alerts: "Alerts",

            // Devices & Tracking
            search_devices: "Search devices…",
            add_device: "Add Device",
            speed: "Speed",
            battery: "Battery",
            ignition: "Ignition",
            ignition_on: "Ignition ON",
            ignition_off: "Ignition OFF",
            last_seen: "Last seen",
            coordinates: "Coordinates",
            address: "Address",
            follow: "Follow",
            track: "Track",
            street_view: "Street View",
            send_command: "Send Command",
            no_devices_found: "No devices found",

            // Geofences
            add_geofence: "Add Geofence",
            search_geofences: "Search geofences…",
            geofence_name: "Geofence Name",
            geofence_type: "Type",
            polygon: "Polygon",
            circle: "Circle",

            // History & Playback
            select_device: "Select Device",
            start_date: "Start Date",
            end_date: "End Date",
            play: "Play",
            pause: "Pause",
            speed_playback: "Speed",
            distance: "Distance",
            duration: "Duration",
            stops: "Stops",
            max_speed: "Max Speed",
            avg_speed: "Average Speed",
            export_gpx: "Export GPX",
            export_kml: "Export KML",

            // Login Page
            sign_in: "Sign In",
            welcome_back: "Welcome to Routario",
            login_subtitle: "Sign in to access your fleet & IoT platform",
            username: "Username",
            password: "Password",
            remember_me: "Remember me",
            login_button: "Sign In",
            login_passkey: "Login with Passkey",
            forgot_password: "Forgot Password?",
            enter_username: "Enter username",
            enter_password: "Enter password",

            // Settings & Preferences
            pref_regional: "Preferences & Regional",
            unit_system: "Unit System",
            unit_metric: "Metric (km, km/h)",
            unit_imperial: "Imperial (mi, mph)",
            currency: "Currency",
            theme: "Appearance Theme",
            theme_dark: "Dark (Default)",
            theme_light: "Light",
            sidebar_layout: "Sidebar Layout",
            sidebar_standard: "Standard (Full)",
            sidebar_compact: "Compact (Single Line)",
            time_format: "Time Format",
            date_format: "Date Format",

            // Management Sections
            device_management: "Device Management",
            users: "Users",
            companies: "Companies",
            drivers: "Drivers",
            sim_cards: "SIM Cards",
            plugins: "Plugins",
            system_settings: "System Settings",
            audit_logs: "Audit Logs",
            tickets: "Support Tickets",
            webhooks: "Webhooks",
            api_keys: "API Keys",
            backups: "Backups"
        },
        fa: {
            app_name: "روتاریو",
            language: "زبان",
            lang_en: "English",
            lang_fa: "فارسی",
            save: "ذخیره",
            cancel: "انصراف",
            delete: "حذف",
            edit: "ویرایش",
            create: "ایجاد",
            add: "افزودن",
            search: "جستجو",
            filter: "فیلتر",
            refresh: "به‌روزرسانی",
            close: "بستن",
            confirm: "تأیید",
            actions: "عملیات",
            status: "وضعیت",
            name: "نام",
            description: "توضیحات",
            type: "نوع",
            details: "جزئیات",
            loading: "در حال بارگذاری…",
            no_data: "اطلاعاتی موجود نیست",
            all: "همه",
            online: "آنلاین",
            offline: "آفلاین",
            unknown: "نامشخص",
            moving: "در حال حرکت",
            stopped: "متوقف",
            idle: "درجا",
            clear_cache: "پاکسازی حافظه",
            logout: "خروج از حساب",
            profile: "پروفایل",

            // Navigation & Header
            dashboard: "داشبورد رهگیری",
            management: "مدیریت سیستم",
            fleet_reports: "گزارش‌های ناوگان",
            user_settings: "تنظیمات کاربر",
            voice_ptt: "مکالمه صوتی بیسیم",
            routes: "مدیریت مسیرها",
            ai_copilot: "دستیار هوشمند",
            super_admin: "مدیر کل سامانه",
            company_admin: "مدیر شرکت",
            user_role: "کاربر عادی",

            // Dashboard Sidebar Tabs
            tab_devices: "دستگاه‌ها",
            tab_geofences: "محدوده‌ها",
            tab_history: "تاریخچه",
            tab_sensors: "سنسورها",
            tab_logbook: "دفترچه وقایع",
            tab_alerts: "هشدارها",

            // Devices & Tracking
            search_devices: "جستجوی دستگاه‌ها…",
            add_device: "افزودن دستگاه",
            speed: "سرعت",
            battery: "باتری",
            ignition: "سوئیچ",
            ignition_on: "روشن",
            ignition_off: "خاموش",
            last_seen: "آخرین وضعیت",
            coordinates: "مختصات جغرافیایی",
            address: "آدرس",
            follow: "دنبال کردن",
            track: "رهگیری",
            street_view: "نمای خیابان",
            send_command: "ارسال دستور",
            no_devices_found: "دستگاهی یافت نشد",

            // Geofences
            add_geofence: "افزودن محدوده",
            search_geofences: "جستجوی محدوده‌ها…",
            geofence_name: "نام محدوده",
            geofence_type: "نوع محدوده",
            polygon: "چندضلعی",
            circle: "دایره",

            // History & Playback
            select_device: "انتخاب خودرو / دستگاه",
            start_date: "زمان شروع",
            end_date: "زمان پایان",
            play: "پخش مسیر",
            pause: "توقف پخش",
            speed_playback: "سرعت پخش",
            distance: "مسافت طی‌شده",
            duration: "مدت زمان",
            stops: "تعداد توقف‌ها",
            max_speed: "حداکثر سرعت",
            avg_speed: "میانگین سرعت",
            export_gpx: "خروجی GPX",
            export_kml: "خروجی KML",

            // Login Page
            sign_in: "ورود به سامانه",
            welcome_back: "به سامانه مدیریت ناوگان خوش آمدید",
            login_subtitle: "برای مدیریت ناوگان و تجهیزات IoT وارد حساب کاربری خود شوید",
            username: "نام کاربری",
            password: "رمز عبور",
            remember_me: "مرا به خاطر بسپار",
            login_button: "ورود به سیستم",
            login_passkey: "ورود با کلید عبور (Passkey)",
            forgot_password: "رمز عبور را فراموش کرده‌اید؟",
            enter_username: "نام کاربری خود را وارد کنید",
            enter_password: "رمز عبور خود را وارد کنید",

            // Settings & Preferences
            pref_regional: "تنظیمات منطقه‌ای و نمایش",
            unit_system: "سیستم اندازه‌گیری",
            unit_metric: "متریک (کیلومتر، کیلومتر بر ساعت)",
            unit_imperial: "امپریال (مایل، فوت)",
            currency: "واحد پول",
            theme: "پوسته ظاهری",
            theme_dark: "تم تیره (پیش‌فرض)",
            theme_light: "تم روشن",
            sidebar_layout: "چیدمان سایدبار",
            sidebar_standard: "استاندارد (کامل)",
            sidebar_compact: "فشرده (تک خطی)",
            time_format: "فرمت زمان",
            date_format: "فرمت تاریخ",

            // Management Sections
            device_management: "مدیریت دستگاه‌ها",
            users: "مدیریت کاربران",
            companies: "مدیریت شرکت‌ها",
            drivers: "رانندگان",
            sim_cards: "سیم‌کارت‌ها",
            plugins: "پلاگین‌ها",
            system_settings: "تنظیمات سیستم",
            audit_logs: "گزارش رویدادها (Audit Logs)",
            tickets: "تیکت‌های پشتیبانی",
            webhooks: "وب‌هوک‌ها",
            api_keys: "کلیدهای API",
            backups: "پشتیبان‌گیری"
        }
    };

    // Dictionary of direct text mappings for all UI elements, Admin forms, Modals, Tables, and Dates
    const autoTextMap = {
        // Sections & Header
        "Management": "مدیریت سامانه",
        "Fleet Reports": "گزارش‌های ناوگان",
        "User Settings": "تنظیمات کاربر",
        "Voice PTT": "مکالمه صوتی",
        "Routes": "مسیرها",
        "AI Copilot": "دستیار هوش مصنوعی",
        "Clear Cache": "پاکسازی حافظه",
        "Sign Out": "خروج از حساب",
        "Profile": "پروفایل",
        "Super Admin": "مدیر کل",
        "Company Admin": "مدیر شرکت",
        "User": "کاربر",

        // Admin Tabs in management.html
        "Devices": "دستگاه‌ها",
        "Companies": "شرکت‌ها",
        "Users": "کاربران",
        "Drivers": "رانندگان",
        "SIM Cards": "سیم‌کارت‌ها",
        "Geofences": "محدوده‌ها",
        "Maintenance": "سرویس و نگهداری",
        "Integrations": "یکپارچه‌سازی",
        "Audit Log": "گزارش رویدادها",
        "System Settings": "تنظیمات سیستم",
        "Plugins": "پلاگین‌ها",
        "Billing": "تعرفه‌ها و صورتحساب",

        // Dashboard Tabs
        "History": "تاریخچه",
        "Sensors": "سنسورها",
        "Logbook": "دفترچه وقایع",
        "Alerts": "هشدارها",

        // Actions & Buttons
        "Add Device": "افزودن دستگاه",
        "+ Add Device": "+ افزودن دستگاه",
        "New Device": "دستگاه جدید",
        "Edit Device": "ویرایش دستگاه",
        "Add Company": "افزودن شرکت",
        "+ Add Company": "+ افزودن شرکت",
        "New Company": "شرکت جدید",
        "Edit Company": "ویرایش شرکت",
        "Add User": "افزودن کاربر",
        "+ Add User": "+ افزودن کاربر",
        "New User": "کاربر جدید",
        "Edit User": "ویرایش کاربر",
        "Add Driver": "افزودن راننده",
        "+ Add Driver": "+ افزودن راننده",
        "New Driver": "راننده جدید",
        "Edit Driver": "ویرایش راننده",
        "Add SIM Card": "افزودن سیم‌کارت",
        "+ Add SIM Card": "+ افزودن سیم‌کارت",
        "Add SIM": "افزودن سیم‌کارت",
        "+ Add SIM": "+ افزودن سیم‌کارت",
        "New SIM Card": "سیم‌کارت جدید",
        "Edit SIM Card": "ویرایش سیم‌کارت",
        "Add Geofence": "افزودن محدوده",
        "+ Add Geofence": "+ افزودن محدوده",
        "Save": "ذخیره",
        "Save Changes": "ذخیره تغییرات",
        "Cancel": "انصراف",
        "Delete": "حذف",
        "Close": "بستن",
        "Edit": "ویرایش",
        "Create": "ایجاد",
        "Create Device": "ایجاد دستگاه",
        "Create User": "ایجاد کاربر",
        "Create Company": "ایجاد شرکت",
        "Create Driver": "ایجاد راننده",
        "Create SIM Card": "ایجاد سیم‌کارت",
        "Export": "خروجی",
        "Export CSV": "خروجی CSV",
        "Export Excel": "خروجی اکسل",
        "Export GPX": "خروجی GPX",
        "Export KML": "خروجی KML",
        "Refresh": "به‌روزرسانی",
        "Reset": "بازنشانی",
        "Apply": "اعمال",
        "Confirm": "تأیید",
        "Send Command": "ارسال فرمان",
        "Send Reply": "ارسال پاسخ",

        // Form Fields & Labels
        "Device Name": "نام دستگاه",
        "Device Identifier": "شناسه دستگاه (IMEI)",
        "IMEI / Identifier": "شناسه دستگاه / IMEI",
        "IMEI": "شناسه IMEI",
        "Protocol": "پروتکل ارتباطی",
        "Phone Number": "شماره تلفن",
        "SIM Phone Number": "شماره سیم‌کارت",
        "Company": "شرکت",
        "Device Group": "گروه دستگاه",
        "Vehicle Model": "مدل خودرو",
        "Plate Number": "پلاک خودرو",
        "License Plate": "پلاک خودرو",
        "Odometer": "کیلومتر شمار",
        "Odometer (km)": "کیلومتر شمار (کیلومتر)",
        "Engine Hours": "ساعت کارکرد موتور",
        "Engine Hours (h)": "ساعت کارکرد موتور (ساعت)",
        "Active": "فعال",
        "Disabled": "غیرفعال",
        "Notes": "یادداشت‌ها و توضیحات",
        "Icon": "آیکون",
        "Color": "رنگ",
        "Last Seen": "آخرین وضعیت",
        "Last Update": "آخرین به‌روزرسانی",
        "Never": "هرگز",
        "Actions": "عملیات",

        // Company Form
        "Company Name": "نام شرکت",
        "Max Devices": "حداکثر تعداد دستگاه",
        "Contact Name": "نام مخاطب",
        "Contact Email": "ایمیل مخاطب",
        "Contact Phone": "تلفن مخاطب",
        "Tax / Reg Number": "شماره ثبت / کد اقتصادی",
        "Address": "آدرس",

        // User Form
        "Username": "نام کاربری",
        "Email": "آدرس ایمیل",
        "Role": "نقش کاربر",
        "Super Administrator": "مدیر کل سامانه",
        "Company Administrator": "مدیر شرکت",
        "Standard User": "کاربر عادی",
        "Read Only": "فقط خواندنی",
        "Password": "رمز عبور",
        "Confirm Password": "تکرار رمز عبور",
        "New Password": "رمز عبور جدید",
        "Permissions": "سطوح دسترسی",

        // Driver Form
        "Driver Name": "نام و نام خانوادگی راننده",
        "License Number": "شماره گواهینامه",
        "RFID / iButton Key": "کلید RFID / iButton",
        "RFID Key": "کلید RFID",
        "Assigned Vehicle": "خودروی اختصاص‌یافته",

        // SIM Form
        "ICCID": "شناسه ICCID",
        "Carrier": "اپراتور مخابراتی",
        "APN": "نام نقطه دسترسی (APN)",
        "Plan": "بسته / تعرفه",
        "Expiry Date": "تاریخ انقضا",
        "Monthly Data Limit": "محدودیت حجم ماهانه",
        "Data Usage": "میزان مصرف داده",

        // Date & History Controls
        "Start Time": "زمان شروع",
        "End Time": "زمان پایان",
        "Start Date": "تاریخ شروع",
        "End Date": "تاریخ پایان",
        "From": "از تاریخ",
        "To": "تا تاریخ",
        "Today": "امروز",
        "Yesterday": "دیروز",
        "This Week": "این هفته",
        "Last 7 days": "۷ روز گذشته",
        "Last 14 days": "۱۴ روز گذشته",
        "Last 30 days": "۳۰ روز گذشته",
        "Last 24 Hours": "۲۴ ساعت گذشته",
        "Custom Range": "بازه انتخابی",
        "Select date": "انتخاب تاریخ",
        "Select date and time": "انتخاب تاریخ و زمان",

        // Table & Status labels
        "Status": "وضعیت",
        "Name": "نام",
        "Description": "توضیحات",
        "Type": "نوع",
        "Details": "جزئیات",
        "All": "همه",
        "Online": "آنلاین",
        "Offline": "آفلاین",
        "Moving": "در حال حرکت",
        "Stopped": "متوقف",
        "Idle": "درجا",
        "Unknown": "نامشخص",
        "Speed": "سرعت",
        "Battery": "باتری",
        "Ignition": "سوئیچ",
        "Ignition ON": "روشن",
        "Ignition OFF": "خاموش",
        "Coordinates": "مختصات",
        "Follow": "دنبال کردن",
        "Track": "ردیابی",
        "Street View": "نمای خیابان",
        "Play": "پخش",
        "Pause": "توقف",
        "Distance": "مسافت",
        "Duration": "مدت زمان",
        "Stops": "توقف‌ها",
        "Max Speed": "حداکثر سرعت",
        "Average Speed": "میانگین سرعت",

        // Search & Placeholders
        "Search...": "جستجو...",
        "Search…": "جستجو…",
        "Search devices…": "جستجوی دستگاه‌ها…",
        "Search devices...": "جستجوی دستگاه‌ها…",
        "Search geofences…": "جستجوی محدوده‌ها…",
        "Search geofences...": "جستجوی محدوده‌ها…",
        "Search users…": "جستجوی کاربران…",
        "Search companies…": "جستجوی شرکت‌ها…",
        "Search drivers…": "جستجوی رانندگان…",
        "Search SIM cards…": "جستجوی سیم‌کارت‌ها…",
        "Filter by company": "فیلتر بر اساس شرکت",
        "Filter by protocol": "فیلتر بر اساس پروتکل",
        "Filter by status": "فیلتر بر اساس وضعیت",
        "All Companies": "همه شرکت‌ها",
        "All Protocols": "همه پروتکل‌ها",
        "All Statuses": "همه وضعیت‌ها",

        // Preferences & Regional
        "Preferences & Regional": "تنظیمات منطقه‌ای و نمایش",
        "Unit System": "سیستم واحدها",
        "Currency": "واحد پول",
        "Theme": "پوسته ظاهری",
        "Appearance Theme": "پوسته ظاهری",
        "Sidebar Layout": "چیدمان سایدبار",
        "Time Format": "فرمت زمان",
        "Date Format": "فرمت تاریخ",
        "Metric (km, km/h)": "متریک (کیلومتر، کیلومتر بر ساعت)",
        "Metric (km, km/h, m)": "متریک (کیلومتر، کیلومتر بر ساعت، متر)",
        "Imperial (mi, mph)": "امپریال (مایل، فوت)",
        "Imperial (mi, mph, ft)": "امپریال (مایل، فوت)",
        "Dark (Default)": "تم تیره (پیش‌فرض)",
        "Dark Theme (Default)": "تم تیره (پیش‌فرض)",
        "Light": "تم روشن",
        "Light Theme": "تم روشن",
        "Standard (Full)": "استاندارد (کامل)",
        "Standard (Detailed)": "استاندارد (با جزئیات)",
        "Compact (Single Line)": "فشرده (تک خطی)",
        "Compact (Single line)": "فشرده (تک خطی)",
        "System Default": "پیش‌فرض سیستم",
        "Live Breadcrumb Trail": "ردپای زنده مسیر خودرو",
        "Standard (10 points · Default)": "استاندارد (۱۰ نقطه · پیش‌فرض)",
        "Minimal (5 points)": "حداقل (۵ نقطه)",
        "Detailed (25 points)": "کامل (۲۵ نقطه)",
        "Full (50 points)": "حداکثر (۵۰ نقطه)",
        "Off": "خاموش",
        "Euro (EUR)": "یورو (EUR)",
        "US Dollar (USD)": "دلار آمریکا (USD)",
        "British Pound (GBP)": "پوند انگلیس (GBP)",
        "Iranian Rial (IRR)": "ریال ایران (IRR)",
        "English (LTR)": "انگلیسی (LTR)",
        "فارسی (RTL)": "فارسی (RTL)",

        // User Settings (Account & Security)
        "Account & Password": "حساب کاربری و رمز عبور",
        "Email Address": "آدرس ایمیل",
        "Phone Number (Optional)": "شماره تلفن (اختیاری)",
        "(Optional)": "(اختیاری)",
        "Leave blank to keep current password": "برای حفظ رمز فعلی خالی بگذارید",
        "Save Account": "ذخیره حساب کاربری",
        "Save Profile": "ذخیره پروفایل",
        "Profile saved": "تنظیمات با موفقیت ذخیره شد",
        "Update your account details, display preferences, and sign-in security methods.": "اطلاعات حساب، تنظیمات نمایش و روش‌های امنیتی ورود به سیستم خود را به‌روزرسانی کنید.",
        "Language / زبان": "زبان پیش‌فرض",
        "Default Language": "زبان پیش‌فرض",
        "Default Language / زبان پیش‌فرض": "زبان پیش‌فرض",
        "زبان پیش‌فرض / Default Language": "زبان پیش‌فرض",

        // Fleet Reports tab & controls (Image 1)
        "Reports": "گزارش‌ها",
        "Schedules": "زمان‌بندی‌ها",
        "Health": "سلامت سیستم",
        "Logs": "لاگ‌های سیستم",
        "Report Type": "نوع گزارش",
        "Generate": "تولید گزارش",
        "All users": "همه کاربران",
        "All vehicles": "همه خودروها",
        "All drivers": "همه رانندگان",
        "Users": "کاربران",
        "Vehicles": "خودروها",
        "Drivers": "رانندگان",
        "Historical data": "داده‌های تاریخی",
        "View Mode": "حالت نمایش",
        "Graph & Table": "نمودار و جدول",
        "Graph Only": "فقط نمودار",
        "Table Only": "فقط جدول",
        "Loading reports...": "در حال دریافت گزارش‌ها…",
        "Back to Schedules": "بازگشت به زمان‌بندی‌ها",
        "Alert history for the selected period. Admins can filter by user.": "تاریخچه هشدارها برای بازه انتخابی. مدیران می‌توانند بر اساس کاربر فیلتر کنند.",
        "Alert history for the selected period. Admins can filter by user": "تاریخچه هشدارها برای بازه انتخابی. مدیران می‌توانند بر اساس کاربر فیلتر کنند",
        "Individual trips with start/end location, distance, duration, and driver. Click any row to view the route on a map.": "سفرهای مجزا با موقعیت شروع/پایان، مسافت، مدت‌زمان و راننده. برای مشاهده مسیر روی نقشه، روی هر ردیف کلیک کنید.",
        "Totals per vehicle for the selected period — trips, distance, driving time, and top speed.": "مجموع کارکرد هر خودرو در بازه انتخابی — سفرها، مسافت، زمان رانندگی و حداکثر سرعت.",
        "Outbound VoIP and SIP voice call history, call duration, status, and destination extensions.": "تاریخچه تماس‌های صوتی خروجی VoIP و SIP، مدت تماس، وضعیت و شماره‌های مقصد.",
        "SIM card data usage, cost, and session history for assigned vehicles over the selected period.": "میزان مصرف داده سیم‌کارت، هزینه و تاریخچه اتصال برای خودروهای مربوطه در بازه انتخابی.",
        "Interactive sensor graphs and data tables for up to 5 vehicles across a date range.": "نمودارهای تعاملی سنسورها و جداول داده برای حداکثر ۵ خودرو در بازه زمانی انتخابی.",
        "Current sensor readings for all vehicles. Enable historical data to view sensor values over a date range.": "آخرین قرائت‌های سنسور تمام خودروها. برای مشاهده مقادیر سنسور در طول زمان، گزینه داده‌های تاریخی را فعال کنید.",
        "Fuel or maintenance logbook reports for the selected vehicles and period.": "گزارش‌های دفترچه وقایع سوخت یا سرویس و نگهداری برای خودروها و بازه انتخابی.",
        "Geofence enter and exit activity by vehicle, geofence, event, and recipient.": "فعالیت ورود و خروج از محدوده‌های جغرافیایی بر اساس خودرو، محدوده، رویداد و دریافت‌کننده.",
        "Driver safety performance, eco scores (0-100), harsh accelerations, harsh braking, sharp cornering, and speeding metrics.": "عملکرد ایمنی راننده، امتیاز رانندگی اقتصادی (۰-۱۰۰)، شتاب ناگهانی، ترمز شدید، پیچیدن تند و سرعت غیرمجاز.",
        "Activity per driver for the selected period — trips, distance, driving time, and top speed.": "میزان فعالیت هر راننده در بازه انتخابی — سفرها، مسافت، زمان رانندگی و حداکثر سرعت.",
        "Trip activity aggregated by day for the whole fleet, each vehicle, or each driver.": "فعالیت سفرها به تفکیک روز برای کل ناوگان، هر خودرو یا هر راننده.",
        "Draft billing usage and totals by company for the selected billing period.": "پیش‌نویس کارکرد و مبالغ صورتحساب به تفکیک شرکت برای دوره صورتحساب انتخابی.",
        "System audit log for super admins.": "گزارش رویدادهای سیستم برای مدیران کل.",
        "Account readiness by user — vehicle access, push status, notification channels, alert backlog, schedules, and key permissions.": "وضعیت آمادگی حساب به تفکیک کاربر — دسترسی خودروها، اعلان‌ها، کانال‌ها، کارتابل هشدارها و دسترسی‌ها.",

        // Management & Plugins (Image 4)
        "Notifications": "اعلان‌ها",
        "Dashboard": "داشبورد",
        "Browse Store": "فروشگاه پلاگین‌ها",
        "Upload Plugin (.zip)": "بارگذاری پلاگین (.zip)",
        "Upload Plugin": "بارگذاری پلاگین",
        "Setup Wizard": "دستیار راه‌اندازی",
        "Import Device": "درون‌ریزی دستگاه",
        "Send Notification": "ارسال اعلان",
        "Exchange Rates": "نرخ‌های ارز",
        "Create Plan": "ایجاد تعرفه",
        "Add Notification Channel": "افزودن کانال اعلان",
        "Add Route": "افزودن مسیر",
        "Search by name, author, category, component…": "جستجو بر اساس نام، سازنده، دسته‌بندی، ماژول…",
        "Search by name, author, category, component...": "جستجو بر اساس نام، سازنده، دسته‌بندی، ماژول…",
        "Plugin": "پلاگین",
        "PLUGIN": "پلاگین",
        "Components": "اجزا و ماژول‌ها",
        "COMPONENTS": "اجزا و ماژول‌ها",
        "Usage Tracking": "میزان مصرف",
        "USAGE TRACKING": "میزان مصرف",
        "Enabled": "فعال",
        "No plugins installed yet. Open the top-right settings menu and click Browse Store to discover and install plugins.": "هنوز پلاگینی نصب نشده است. منوی تنظیمات بالا را باز کرده و برای جستجو و نصب پلاگین روی «فروشگاه پلاگین‌ها» کلیک کنید.",
        "No plugins installed yet.": "هنوز هیچ پلاگینی نصب نشده است.",
        "0 plugins": "۰ پلاگین",
        "Loading plugins…": "در حال بارگذاری پلاگین‌ها…",
        "Loading installed plugins…": "در حال بارگذاری پلاگین‌های نصب‌شده…",

        // Dashboard & Sidebar (Image 5)
        "No devices assigned to this user.": "هیچ دستگاهی به این کاربر اختصاص داده نشده است.",
        "No devices assigned to this user": "هیچ دستگاهی به این کاربر اختصاص داده نشده است",
        "Search devices…": "جستجوی دستگاه‌ها…",
        "Search devices...": "جستجوی دستگاه‌ها…",
        "Recent": "جدیدترین",
        "Map Layers": "لایه‌های نقشه",
        "Show my location": "موقعیت من",
        "Zoom In": "بزرگ‌نمایی",
        "Zoom Out": "کوچک‌نمایی",
        "Geofence Tools": "ابزارهای محدوده جغرافیایی",
        "Draw Zone (Polygon)": "رسم محدوده (چندضلعی)",
        "Draw Path (Polyline)": "رسم مسیر (خط ممتد)",
        "Navigation Path": "مسیر ناوبری",
        "Show other users' geofences": "نمایش محدوده‌های سایر کاربران",
        "History Details": "جزئیات تاریخچه",
        "Trips": "سفرها",
        "Point Details": "جزئیات نقطه",
        "Change Date Range": "تغییر بازه زمانی",
        "Toggle Sidebar": "منوی کناری",

        // Device Table & Search (Image 2)
        "Search by name, IMEI, plate, protocol, company…": "جستجو بر اساس نام، IMEI، پلاک، پروتکل، شرکت…",
        "Search by name, IMEI, plate, protocol, company...": "جستجو بر اساس نام، IMEI، پلاک، پروتکل، شرکت…",
        "Search by name…": "جستجو بر اساس نام…",
        "Search by name...": "جستجو بر اساس نام…",
        "No devices found": "هیچ دستگاهی یافت نشد",
        "No devices found.": "هیچ دستگاهی یافت نشد.",
        "Plate": "پلاک",
        "PLATE": "پلاک",
        "Protocol": "پروتکل ارتباطی",
        "PROTOCOL": "پروتکل ارتباطی",
        "Last Seen": "آخرین وضعیت",
        "LAST SEEN": "آخرین وضعیت",
        "Odometer": "کیلومتر شمار",
        "ODOMETER": "کیلومتر شمار",

        // User Edit Modal (Image 3)
        "Username *": "نام کاربری *",
        "* Username": "نام کاربری *",
        "Email *": "ایمیل *",
        "* Email": "ایمیل *",
        "Password *": "گذرواژه *",
        "* Password": "گذرواژه *",
        "Role *": "نقش کاربری *",
        "* Role": "نقش کاربری *",
        "Company *": "شرکت *",
        "* Company": "شرکت *",
        "Password (leave blank to keep)": "گذرواژه (برای عدم تغییر، خالی بگذارید)",
        "Leave blank to keep current password": "برای حفظ گذرواژه فعلی خالی بگذارید",
        "Edit User": "ویرایش کاربر",
        "Add User": "افزودن کاربر",
        "User": "کاربر عادی",
        "Company Admin": "مدیر شرکت",
        "Super Admin": "مدیر کل سامانه",
        "— Select company —": "— انتخاب شرکت —",

        // Runtime Logs Tab (Image 4)
        "CRITICAL": "بحرانی",
        "Critical": "بحرانی",
        "ERRORS": "خطاها",
        "Errors": "خطاها",
        "WARNINGS": "هشدارها",
        "Warnings": "هشدارها",
        "INFO": "اطلاعات",
        "Info": "اطلاعات",
        "DEBUG": "دیباگ",
        "Debug": "دیباگ",
        "TOTAL": "مجموع",
        "Total": "مجموع",
        "Search runtime logs...": "جستجوی لاگ‌های سیستم...",
        "Search runtime logs…": "جستجوی لاگ‌های سیستم…",
        "TIME": "زمان",
        "Time": "زمان",
        "LEVEL": "سطح",
        "Level": "سطح",
        "LOGGER": "ثبت‌کننده",
        "Logger": "ثبت‌کننده",
        "MESSAGE": "پیام",
        "Message": "پیام",

        // Schedules Tab (Image 5)
        "Search by name, type, frequency…": "جستجو بر اساس نام، نوع، دوره تکرار…",
        "Search by name, type, frequency...": "جستجو بر اساس نام، نوع، دوره تکرار…",
        "FREQUENCY": "دوره تکرار",
        "Frequency": "دوره تکرار",
        "NEXT RUN": "اجرای بعدی",
        "Next Run": "اجرای بعدی",
        "RUNS": "دفعات اجرا",
        "Runs": "دفعات اجرا",
        "No schedules yet. Use the gear menu to create one.": "هنوز زمان‌بندی ایجاد نشده است. از منوی تنظیمات برای ایجاد استفاده کنید.",
        "No schedules yet. Use the gear menu to create one": "هنوز زمان‌بندی ایجاد نشده است. از منوی تنظیمات برای ایجاد استفاده کنید",
        "No schedules match your search.": "هیچ زمان‌بندی با جستجوی شما مطابقت ندارد.",

        // Device Modal & Form Fields
        "Device Name *": "نام دستگاه *",
        "* Device Name": "نام دستگاه *",
        "IMEI *": "شناسه IMEI *",
        "* IMEI": "شناسه IMEI *",
        "Vehicle Type": "نوع خودرو",
        "Custom Attributes": "مشخصه‌های سفارشی",
        "Add attribute": "افزودن مشخصه",
        "Assigned Users": "کاربران منتسب",
        "Dashcam": "دوربین ثبت وقایع",
        "This device has a dashcam": "این دستگاه دارای دوربین است",
        "Device Status": "وضعیت دستگاه",
        "Disable device": "غیرفعال‌سازی دستگاه",
        "Export Profile": "خروجی پیکربندی",
        "Commands": "دستورات",
        "Raw Data": "داده‌های خام",
        "General": "عمومی",

        // Company Modal
        "Company Name *": "نام شرکت *",
        "* Company Name": "نام شرکت *",
        "Application Name": "نام برنامه",
        "Login URL Slug": "شناسه آدرس ورود",
        "Billing Plan": "طرح صورتحساب",
        "No billing plan": "بدون طرح صورتحساب",
        "Branding": "نشان و برندسازی",
        "App Icon": "آیکون برنامه",
        "Notification Badge": "نشان اعلان",

        // Driver Modal
        "Add Driver": "افزودن راننده",
        "Edit Driver": "ویرایش راننده",
        "Full Name *": "نام و نام خانوادگی *",
        "* Full Name": "نام و نام خانوادگی *",
        "Notes": "یادداشت‌ها",
        "Optional notes…": "یادداشت‌های اختیاری…",
        "Optional notes...": "یادداشت‌های اختیاری…",
        "Auto-Assignment": "تخصیص خودکار",
        "All company vehicles": "همه خودروهای شرکت",
        "Rule": "قاعده شرطی",
        "Assign Vehicle": "تخصیص خودرو",
        "Driver:": "راننده:",
        "Vehicle": "خودرو",
        "— Unassigned —": "— تخصیص‌نیافته —",
        "Select a vehicle to manually assign this driver to.": "یک خودرو را برای تخصیص دستی این راننده انتخاب کنید.",
        "Save Assignment": "ذخیره تخصیص",
        "Syntax reference": "راهنمای قواعد نگارش",
        "— Disabled —": "— غیرفعال —",
        "One-time": "یک‌باره",
        "Continuous": "پیوسته",
        "Clear When": "پاکسازی هنگام",
        "Never": "هرگز",
        "On ignition off": "هنگام خاموش شدن خودرو",
        "On trip end": "هنگام پایان سفر",
        "Grace Period (seconds)": "مهلت مجاز (ثانیه)",
        "This driver is linked to a user account. Name is managed via the Users section.": "این راننده به یک حساب کاربری متصل است. نام از بخش کاربران مدیریت می‌شود.",

        // SIM Card Modal
        "Add SIM Card": "افزودن سیم‌کارت",
        "Edit SIM Card": "ویرایش سیم‌کارت",
        "Provider & Credentials": "اپراتور و اطلاعات احراز هویت",
        "Provider": "اپراتور",
        "Test Connection": "آزمایش اتصال",
        "Fetch Remote SIMs": "دریافت سیم‌کارت‌های راه دور",
        "Select Remote SIM": "انتخاب سیم‌کارت سرور",
        "Phone Number / MSISDN": "شماره تماس / MSISDN",
        "Plan Name": "نام بسته / تعرفه",
        "Account & Assignment": "حساب کاربری و تخصیص",
        "Account / Label": "عنوان حساب / برچسب",
        "Balance": "اعتبار / موجودی",
        "Remaining Data (MB)": "داده باقیمانده (مگابایت)",
        "Expiry Date": "تاریخ انقضا",
        "Assigned Vehicle": "خودرو تخصیص‌یافته",
        "Select date": "انتخاب تاریخ",

        // Company Modal
        "Company Name *": "نام شرکت *",
        "* Company Name": "نام شرکت *",
        "Application Name": "نام برنامه",
        "Login URL Slug": "شناسه یکتای آدرس ورود",
        "Billing Plan": "طرح تعرفه",
        "No billing plan": "بدون طرح تعرفه",
        "Branding": "برندسازی",
        "App Icon": "آیکون برنامه",
        "Used for app icons and favicon": "برای آیکون برنامه و فاوآیکون استفاده می‌شود",
        "Notification Badge": "نشان اعلان",
        "Upload a 96x96 badge": "یک نشان ۹۶×۹۶ بارگذاری کنید",
        "Upload": "بارگذاری",
        "Default": "پیش‌فرض",

        // Device Modal
        "Export Profile": "خروجی پیکربندی",
        "Export full device configuration to JSON": "خروجی کامل تنظیمات دستگاه به فرمت JSON",
        "Dashcam": "دوربین خودرو",
        "This device has a dashcam": "این دستگاه دارای دوربین است",
        "Device Status": "وضعیت دستگاه",
        "Disable device": "غیرفعال‌سازی دستگاه",
        "When disabled, this device is hidden from the map, commands are blocked, background polling stops, and incoming data is ignored.": "در صورت غیرفعال بودن، دستگاه از نقشه پنهان، ارسال دستورات مسدود و داده‌های ورودی نادیده گرفته می‌شوند.",
        "Vehicle Type": "نوع خودرو",
        "Custom Attributes": "ویژگی‌های سفارشی",
        "Add attribute": "افزودن ویژگی",
        "— None —": "— هیچ‌کدام —",
        "Assigned Users": "کاربران تخصیص‌یافته",
        "Select users…": "انتخاب کاربران…",
        "Select users...": "انتخاب کاربران…",
        "Select all": "انتخاب همه",
        "Clear all": "پاکسازی همه",
        "Regular users with access to this device. Admins have access automatically.": "کاربران عادی که به این دستگاه دسترسی دارند. مدیران به صورت خودکار دسترسی دارند.",
        "Current Odometer (km)": "کیلومترشمار فعلی (کیلومتر)",
        "Adjust only if resetting or correcting": "فقط برای تنظیم مجدد یا اصلاح تغییر دهید",
        "Offline Threshold (hours)": "آستانه آفلاین شدن (ساعت)",
        "Hours without data before vehicle is considered offline": "تعداد ساعت عدم ارسال داده قبل از اینکه خودرو آفلاین در نظر گرفته شود",
        "Trip Merge Gap (minutes)": "فاصله ادغام سفرها (دقیقه)",
        "Merge consecutive trips separated by an ignition-off gap shorter than this. 0 = disabled.": "ادغام سفرهای متوالی که فاصله خاموشی بین آنها کمتر از این مقدار است. ۰ = غیرفعال.",

        // Billing & Notifications
        "Plan Name *": "نام تعرفه *",
        "* Plan Name": "نام تعرفه *",
        "Base Price": "قیمت پایه",
        "Included Devices": "دستگاه‌های شامل‌شده",
        "Per Device": "به ازای هر دستگاه",
        "Included Positions": "موقعیت‌های شامل‌شده",
        "Per 1000 Positions": "به ازای هر ۱۰۰۰ موقعیت",
        "Included API Calls": "فراخوانی‌های API شامل‌شده",
        "Per 1000 API Calls": "به ازای هر ۱۰۰۰ فراخوانی API",
        "Included VoIP Calls": "تماس‌های صوتی VoIP شامل‌شده",
        "Per VoIP Call": "به ازای هر تماس VoIP",
        "Search companies…": "جستجوی شرکت‌ها…",
        "Search companies...": "جستجوی شرکت‌ها…",
        "Internal plan name shown in billing tables and company assignments.": "نام داخلی طرح که در جدول‌های صورتحساب و شرکت‌ها نمایش داده می‌شود.",
        "Fixed monthly amount charged before any usage overages.": "مبلغ ثابت ماهانه قبل از اضافه مصرف.",
        "Active devices included in the base monthly price.": "دستگاه‌های فعال شامل‌شده در هزینه پایه ماهانه.",
        "Monthly charge for each active device above the included amount.": "هزینه ماهانه به ازای هر دستگاه فعال مازاد بر تعداد پایه.",
        "Position messages included per month before overage billing starts.": "پیام‌های موقعیت مکانی ماهانه قبل از آغاز اضافه مصرف.",
        "Charge per started block of 1000 extra position messages.": "هزینه به ازای هر ۱۰۰۰ پیام موقعیت مکانی مازاد.",
        "REST API calls included per month for companies on this plan.": "فراخوانی‌های REST API ماهانه برای شرکت‌های این طرح.",
        "Charge per started block of 1000 API calls above the included amount.": "هزینه به ازای هر ۱۰۰۰ فراخوانی مازاد بر بسته.",
        "Outbound VoIP voice calls included per month for companies on this plan.": "تماس‌های صوتی VoIP ماهانه برای شرکت‌های این طرح.",
        "Charge for each VoIP voice call above the included amount.": "هزینه به ازای هر تماس صوتی مازاد بر بسته.",
        "Monthly Base Fee": "هزینه ثابت ماهانه",
        "Fee Per Device": "هزینه به ازای هر دستگاه",
        "Free Devices Included": "دستگاه‌های رایگان شامل‌شده",
        "Add Notification Channel": "افزودن کانال اعلان",
        "Channel Type": "نوع کانال",
        "Channel Name": "نام کانال",
        "Apprise URL": "آدرس Apprise",
        "Remove": "حذف",
        "Check": "بررسی",
        "Search health checks...": "جستجوی بررسی‌های سلامت...",
        "Search health checks…": "جستجوی بررسی‌های سلامت…",

        // Prompts
        "Are you sure?": "آیا مطمئن هستید؟",
        "Yes, Delete": "بله، حذف شود",
        "Sign In": "ورود به سیستم",
        "Remember me": "مرا به خاطر بسپار",
        "Welcome to Routario": "به مدیریت ناوگان خوش آمدید",

        // Guided Device Setup Wizard
        "Guided Device Setup": "راه‌اندازی گام‌به‌گام دستگاه",
        "Select Company": "انتخاب شرکت",
        "Assign this tracking device to an existing company fleet, create a new company, or leave it platform-wide.": "این دستگاه ردیاب را به یک شرکت اختصاص دهید، شرکت جدید ایجاد کنید یا به صورت سراسری در سامانه قرار دهید.",
        "Existing Company": "شرکت موجود",
        "Assign to an existing company in the platform.": "اختصاص به یکی از شرکت‌های ثبت‌شده در سامانه.",
        "Create New Company": "ایجاد شرکت جدید",
        "Set up a new organization right now.": "راه‌اندازی سریع یک شرکت/سازمان جدید.",
        "Platform Global": "سراسری در سامانه",
        "No company association (system-wide).": "بدون وابستگی به شرکت خاص (عمومی در سطح سامانه).",
        "Tracker Info": "اطلاعات ردیاب",
        "Enter the hardware identification and connection protocol of the GPS device.": "شناسه سخت‌افزاری و پروتکل ارتباطی دستگاه GPS را وارد کنید.",
        "Device Name *": "نام دستگاه *",
        "Protocol *": "پروتکل *",
        "Target Port:": "پورت مقصد:",
        "Target Port": "پورت مقصد",
        "IMEI / Hardware Identifier *": "کد IMEI / شناسه سخت‌افزاری *",
        "Printed on the tracker label or barcode.": "بر روی برچسب یا بارکد ردیاب درج شده است.",
        "Cellular SIM Card (Optional)": "سیم‌کارت ارتباطی (اختیاری)",
        "Associate a SIM card to monitor cellular data usage, balance, and network connectivity.": "برای رصد مصرف اینترنت، شارژ و وضعیت اتصال، سیم‌کارت مربوطه را مشخص کنید.",
        "Existing SIM": "سیم‌کارت موجود",
        "Pick an unassigned SIM from inventory.": "انتخاب سیم‌کارت آزاد از فهرست موجودی.",
        "Register New SIM": "ثبت سیم‌کارت جدید",
        "Add a new SIM or connect via Provider API.": "افزودن سیم‌کارت جدید یا اتصال از طریق وب‌سرویس اپراتور.",
        "Skip SIM Card": "رد کردن مرحله سیم‌کارت",
        "Leave tracker without SIM profile.": "ردیاب فعلاً بدون مشخصات سیم‌کارت ثبت شود.",
        "Available SIM Card": "سیم‌کارت در دسترس",
        "SIM Provider": "اپراتور سیم‌کارت",
        "Test Connection": "تست ارتباط",
        "Fetch Remote SIMs & Fill Data": "دریافت سیم‌کارت‌ها از اپراتور و تکمیل خودکار",
        "Discovered Remote SIM Cards (Select to auto-fill)": "سیم‌کارت‌های دریافتی از اپراتور (جهت تکمیل خودکار انتخاب کنید)",
        "Phone Number / MSISDN *": "شماره تلفن / MSISDN *",
        "Balance / Data (MB)": "موجودی / حجم داده (مگابایت)",
        "Account Label": "برچسب / عنوان حساب",
        "Assign Driver (Optional)": "انتساب راننده (اختیاری)",
        "Assign a primary driver to this vehicle, create a new driver profile, or skip for now.": "راننده اصلی خودرو را تعیین کنید، راننده جدید تعریف کنید، یا این مرحله را رد نمایید.",
        "Existing Driver": "راننده موجود",
        "Select from registered drivers.": "انتخاب از بین رانندگان ثبت‌شده در سامانه.",
        "Create New Driver": "ایجاد راننده جدید",
        "Register a new driver inline.": "ثبت مستقیم مشخصات یک راننده جدید.",
        "Skip Driver": "رد کردن مرحله راننده",
        "Leave vehicle unassigned.": "خودرو فعلاً بدون راننده باقی بماند.",
        "User Access Permissions": "مجوزهای دسترسی کاربران",
        "Choose which users are authorized to view and monitor this device on their dashboard.": "کاربرانی که مجاز به مشاهده و رصد این دستگاه در داشبورد خود هستند را تعیین کنید.",
        "Select User(s)": "انتخاب کاربر(ان)",
        "Grant access to existing platform users.": "اعطای دسترسی به کاربران موجود در سامانه.",
        "Create New User": "ایجاد کاربر جدید",
        "Create a user account and give them access.": "ایجاد حساب کاربری جدید و اختصاص دسترسی به آن.",
        "Skip Access": "رد کردن دسترسی",
        "Do not grant user access right now.": "فعلاً دسترسی کاربری اختصاص داده نشود.",
        "Select All": "انتخاب همه",
        "Only Me": "فقط من",
        "Clear": "پاک کردن",
        "Regular User (Fleet Member)": "کاربر عادی (عضو ناوگان)",
        "No users will be assigned right now. You can assign users later from User Management or Device Settings.": "در حال حاضر کاربری منتسب نخواهد شد. بعداً می‌توانید از بخش مدیریت کاربران یا تنظیمات دستگاه دسترسی بدهید.",
        "Review & Create": "بررسی نهایی و ایجاد",
        "Review your configured parameters before creating the device.": "پارامترهای پیکربندی‌شده را قبل از ثبت دستگاه بررسی کنید.",
        "Device Registered Successfully!": "دستگاه با موفقیت ثبت شد!",
        "Use the tracker connection cheat sheet below to configure your GPS hardware.": "از راهنمای پارامترهای اتصال زیر برای تنظیم سخت‌افزار ردیاب استفاده کنید.",
        "Tracker Connection Parameters": "پارامترهای اتصال ردیاب",
        "Server Host / IP": "آدرس سرور / IP",
        "Protocol Port": "پورت پروتکل",
        "Device Identifier (IMEI)": "شناسه دستگاه (IMEI)",
        "Done & View Devices": "اتمام و مشاهده دستگاه‌ها",
        "Create Device": "ایجاد دستگاه",
        "Back": "قبلی",
        "Continue": "ادامه",
        "Device name is required": "نام دستگاه الزامی است",
        "Please select a protocol": "لطفاً یک پروتکل انتخاب کنید",
        "Device IMEI / Identifier is required": "کد IMEI یا شناسه دستگاه الزامی است",
        "Please select a company or create a new one": "لطفاً یک شرکت انتخاب کرده یا شرکت جدید بسازید",
        "Company name is required": "نام شرکت الزامی است",
        "Please enter a phone number for the SIM card": "لطفاً شماره تلفن سیم‌کارت را وارد نمایید",
        "Driver full name is required": "نام کامل راننده الزامی است",
        "Username is required": "نام کاربری الزامی است",
        "Email address is required": "آدرس ایمیل الزامی است",
        "Password must be at least 8 characters long": "گذرواژه باید حداقل ۸ کاراکتر باشد",
        "Creating...": "در حال ایجاد...",
        "Notifications are blocked": "اعلان‌ها مسدود شده‌اند",
        "Dismiss": "رد کردن",
        "I've enabled them — retry": "فعال کردم — تلاش مجدد",
        "No SIM cards found": "هیچ سیم‌کارتی یافت نشد",
        "Account / Label": "عنوان حساب / برچسب",
        "Phone / MSISDN": "تلفن / MSISDN",
        "Assigned Vehicle": "خودرو منتسب",
        "Expiry": "انقضا",
        "Route Planner": "برنامه‌ریز مسیر",
        "Route Name": "نام مسیر",
        "Blank Stop": "ایستگاه خالی",
        "Save Route": "ذخیره مسیر",
        "Route Details": "جزئیات مسیر",
        "Search by label, phone, provider, vehicle…": "جستجو بر اساس برچسب، تلفن، اپراتور، خودرو…",
        "Search by label, phone, provider, vehicle...": "جستجو بر اساس برچسب، تلفن، اپراتور، خودرو…",

        // Routes, Geofences, Alerts & Sensor Modals
        "Routes": "مسیرها",
        "New Route": "مسیر جدید",
        "Edit Route": "ویرایش مسیر",
        "Stops": "توقف‌ها",
        "Add at least two stops with valid coordinates.": "حداقل دو توقف با مختصات معتبر اضافه کنید.",
        "Click the map to add a stop. Drag markers to adjust points.": "برای افزودن توقف روی نقشه کلیک کنید. برای تنظیم نقاط، نشانگرها را بکشید.",
        "Show on Map": "نمایش روی نقشه",
        "Morning deliveries": "تحویل‌های صبح",
        "Search by route, status, vehicle, or stops...": "جستجو بر اساس مسیر، وضعیت، خودرو یا توقف‌ها...",
        "Search by route, status, vehicle, or stops…": "جستجو بر اساس مسیر، وضعیت، خودرو یا توقف‌ها…",
        "Save Geofence": "ذخیره محدوده جغرافیایی",
        "Name *": "نام *",
        "e.g. Office Zone, Delivery Area": "مثلاً محدوده دفتر، منطقه توزیع",
        "Choose the zone outline and fill colour": "انتخاب رنگ حاشیه و داخل محدوده",
        "Owner": "مالک",
        "Corridor width (metres)": "عرض مسیر (متر)",
        "Alert triggers within this distance of the line": "هشدارها در این فاصله از خط فعال می‌شوند",
        "Quick Select": "انتخاب سریع",
        "Trip Eco & Safety Scorecard": "کارنامه اکو و ایمنی سفر",
        "Sensor History": "تاریخچه سنسور",
        "Only changes": "فقط تغییرات",
        "Full Sensor Report": "گزارش کامل سنسور",
        "24 Hours": "۲۴ ساعت",
        "7 Days": "۷ روز",
        "30 Days": "۳۰ روز",
        "Reading / Value": "مقدار / خوانش",
        "Change": "تغییر",
        "Duration": "مدت زمان",
        "Coordinates": "مختصات",
        "Loading sensor history…": "بارگذاری تاریخچه سنسور…",
        "Prev": "قبلی",
        "Next": "بعدی",
        "Recent Alerts": "هشدارهای اخیر",
        "History": "تاریخچه",
        "Clear All": "پاک کردن همه",
        "Cleared Alerts": "هشدارهای پاک شده",
        "Load More": "بارگذاری بیشتر",
        "Video Clip": "کلیپ ویدیویی",
        "Edit Alert": "ویرایش هشدار",
        "Save Alert": "ذخیره هشدار",
        "— Unassigned —": "— تخصیص نیافته —",
        "— None (Manual SIM) —": "— بدون ارائه‌دهنده (دستی) —",
        "— None / Global —": "— بدون شرکت / سراسری —",
        "New Schedule": "زمان‌بندی جدید",
        "Edit Schedule": "ویرایش زمان‌بندی",
        "Schedule Name": "نام زمان‌بندی",
        "Send To": "ارسال به",
        "Trigger": "محرک",
        "Day of Week": "روز هفته",
        "Day of Month": "روز ماه",
        "Run Time": "زمان اجرا",
        "Keep Last N Runs": "ذخیره آخرین N اجرا",

        // Stepper labels
        "Company": "شرکت",
        "Device": "دستگاه",
        "SIM Card": "سیم‌کارت",
        "Driver": "راننده",
        "Access": "دسترسی",
        "Finish": "پایان"
    };

    // Current language from localStorage (default to 'fa' for Persian users or 'en')
    let currentLang = localStorage.getItem('app_lang') || 'fa';

    // Apply document direction and attributes immediately
    function applyDocumentAttributes(lang) {
        const isRtl = (lang === 'fa');
        document.documentElement.lang = lang;
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('data-lang', lang);
        if (isRtl) {
            document.documentElement.classList.add('rtl');
            if (document.body) document.body.classList.add('rtl');
        } else {
            document.documentElement.classList.remove('rtl');
            if (document.body) document.body.classList.remove('rtl');
        }
    }

    // Execute immediately on script parse
    applyDocumentAttributes(currentLang);

    function t(key, fallback) {
        const dict = translations[currentLang] || translations.en;
        if (dict && dict[key]) return dict[key];
        if (currentLang === 'fa' && autoTextMap[key]) return autoTextMap[key];
        if (translations.en && translations.en[key]) return translations.en[key];
        return fallback !== undefined ? fallback : key;
    }

    // Translate DOM elements marked with data-i18n or matching autoTextMap
    function translateDOM(root = document.body) {
        applyDocumentAttributes(currentLang);
        const scope = (root && root.querySelectorAll) ? root : (document.body || document.documentElement);

        // Explicit data-i18n elements
        scope.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val && val !== key) {
                el.textContent = val;
            }
        });

        scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = t(key);
            if (val && val !== key) {
                el.placeholder = val;
            }
        });

        scope.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const val = t(key);
            if (val && val !== key) {
                el.title = val;
            }
        });

        // Translate matching text nodes if language is Persian
        if (currentLang === 'fa') {
            const walker = document.createTreeWalker(
                scope,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {
                        const tag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
                        if (['script', 'style', 'code', 'pre'].includes(tag)) return NodeFilter.FILTER_REJECT;
                        if (node.parentElement && node.parentElement.closest('.mono, .font-mono, .latlng')) return NodeFilter.FILTER_REJECT;
                        const text = node.nodeValue.trim();
                        if (text && autoTextMap[text]) return NodeFilter.FILTER_ACCEPT;
                        return NodeFilter.FILTER_SKIP;
                    }
                }
            );

            const nodesToReplace = [];
            while (walker.nextNode()) {
                nodesToReplace.push(walker.currentNode);
            }

            nodesToReplace.forEach(node => {
                const trimmed = node.nodeValue.trim();
                if (autoTextMap[trimmed]) {
                    node.nodeValue = node.nodeValue.replace(trimmed, autoTextMap[trimmed]);
                }
            });

            // Update inputs with placeholder matching autoTextMap
            scope.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(inp => {
                const p = inp.placeholder.trim();
                if (autoTextMap[p]) {
                    inp.placeholder = autoTextMap[p];
                }
            });

            // Update elements with title matching autoTextMap
            scope.querySelectorAll('[title]').forEach(el => {
                const title = el.getAttribute('title')?.trim();
                if (title && autoTextMap[title]) {
                    el.setAttribute('title', autoTextMap[title]);
                }
            });

            // Update select option labels matching autoTextMap
            scope.querySelectorAll('select option').forEach(opt => {
                const txt = opt.textContent.trim();
                if (autoTextMap[txt]) {
                    opt.textContent = autoTextMap[txt];
                }
            });
        }

        // Update language switcher buttons text and flag
        const btns = document.querySelectorAll('.lang-switch-btn');
        btns.forEach(btn => {
            const flag = btn.querySelector('.lang-flag');
            const text = btn.querySelector('.lang-text');
            if (currentLang === 'fa') {
                if (flag) flag.textContent = '🇮🇷';
                if (text) text.textContent = 'فارسی';
                btn.title = 'تغییر به English / Switch to English';
            } else {
                if (flag) flag.textContent = '🇬🇧';
                if (text) text.textContent = 'English';
                btn.title = 'Switch to Persian / تغییر به فارسی';
            }
        });
    }

    function setLanguage(lang) {
        if (!['en', 'fa'].includes(lang)) lang = 'fa';
        currentLang = lang;
        localStorage.setItem('app_lang', lang);
        applyDocumentAttributes(lang);
        translateDOM();

        // Dispatch language change event for other scripts
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang, dir: lang === 'fa' ? 'rtl' : 'ltr' }
        }));
    }

    function toggleLanguage() {
        const nextLang = currentLang === 'fa' ? 'en' : 'fa';
        setLanguage(nextLang);
    }

    // Setup MutationObserver to automatically translate newly added DOM nodes and dynamic text changes
    let _observerTimeout = null;
    function setupObserver() {
        if (!window.MutationObserver || !document.body) return;
        const observer = new MutationObserver(mutations => {
            if (currentLang !== 'fa') return;
            let shouldTranslate = false;
            for (let i = 0; i < mutations.length; i++) {
                if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {
                    shouldTranslate = true;
                    break;
                }
                if (mutations[i].type === 'characterData') {
                    const txt = mutations[i].target?.nodeValue?.trim();
                    if (txt && autoTextMap[txt]) {
                        shouldTranslate = true;
                        break;
                    }
                }
            }
            if (shouldTranslate) {
                if (_observerTimeout) clearTimeout(_observerTimeout);
                _observerTimeout = setTimeout(translateDOM, 80);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    // Expose API globally
    window.i18n = {
        t: t,
        get currentLang() { return currentLang; },
        getLanguage: () => currentLang,
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage,
        translateDOM: translateDOM,
        isRtl: () => currentLang === 'fa'
    };
    window.t = t;
    window.setLanguage = setLanguage;
    window.toggleLanguage = toggleLanguage;

    // Run translation on DOM ready and dynamic updates
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            translateDOM();
            setupObserver();
            setTimeout(translateDOM, 250);
            setTimeout(translateDOM, 1000);
        });
    } else {
        translateDOM();
        setupObserver();
        setTimeout(translateDOM, 250);
        setTimeout(translateDOM, 1000);
    }
})();

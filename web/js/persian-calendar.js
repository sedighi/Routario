/**
 * Routario - Jalali (Persian / Shamsi) Calendar Engine & Picker
 * Provides 100% offline, native Jalali date calculation, formatting, and interactive picker.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PersianCalendar = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const PERSIAN_MONTH_NAMES = [
        'فروردین', 'اردیبهشت', 'خرداد',
        'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر',
        'دی', 'بهمن', 'اسفند'
    ];

    const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
    const PERSIAN_WEEKDAYS_FULL = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

    // Convert Latin numbers to Persian digits
    function toPersianDigits(str) {
        if (str === null || str === undefined) return '';
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(str).replace(/[0-9]/g, w => persianDigits[+w]);
    }

    // Convert Persian / Arabic digits to Latin numbers
    function toLatinDigits(str) {
        if (!str) return '';
        return String(str)
            .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776)
            .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632);
    }

    /**
     * Converts Gregorian Date to Jalali [year, month, day]
     */
    function gregorianToJalali(gy, gm, gd) {
        const g_d_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let jy = gy <= 1600 ? 0 : 979;
        gy -= gy <= 1600 ? 621 : 1600;
        let gy2 = gm > 2 ? gy + 1 : gy;
        let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd;
        for (let i = 0; i < gm; ++i) days += g_d_m[i];
        jy += 33 * Math.floor(days / 12053);
        days %= 12053;
        jy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) {
            jy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
        const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        return [jy, jm, jd];
    }

    /**
     * Converts Jalali [year, month, day] to Gregorian [year, month, day]
     */
    function jalaliToGregorian(jy, jm, jd) {
        let gy = jy <= 979 ? 621 : 1600;
        jy -= jy <= 979 ? 0 : 979;
        let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
        gy += 400 * Math.floor(days / 146097);
        days %= 146097;
        if (days > 36524) {
            gy += 100 * Math.floor(--days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        gy += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) {
            gy += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        let gd = days + 1;
        const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm;
        for (gm = 1; gm <= 12 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
        return [gy, gm, gd];
    }

    /**
     * Check if Jalali year is leap
     */
    function isJalaliLeap(jy) {
        const [gy1] = jalaliToGregorian(jy, 12, 30);
        const [gy2] = jalaliToGregorian(jy + 1, 1, 1);
        return (gy1 === gy2 || (gy2 - gy1 === 0));
    }

    /**
     * Number of days in Jalali month
     */
    function getJalaliMonthDays(jy, jm) {
        if (jm <= 6) return 31;
        if (jm <= 11) return 30;
        // Month 12: 29 or 30 in leap year
        const [gy, gm, gd] = jalaliToGregorian(jy, 12, 30);
        const [backJy] = gregorianToJalali(gy, gm, gd);
        return backJy === jy ? 30 : 29;
    }

    /**
     * Format a Date into Jalali date string
     */
    function formatJalaliDate(date, { withMonthName = false, usePersianDigits = true } = {}) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';

        const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        if (withMonthName) {
            const mName = PERSIAN_MONTH_NAMES[jm - 1];
            const str = `${jd} ${mName} ${jy}`;
            return usePersianDigits ? toPersianDigits(str) : str;
        }

        const mm = String(jm).padStart(2, '0');
        const dd = String(jd).padStart(2, '0');
        const str = `${jy}/${mm}/${dd}`;
        return usePersianDigits ? toPersianDigits(str) : str;
    }

    /**
     * Format a Date into Jalali datetime string
     */
    function formatJalaliDateTime(date, { withSeconds = false, usePersianDigits = true } = {}) {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';

        const datePart = formatJalaliDate(d, { usePersianDigits: false });
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        let timePart = `${hh}:${mm}`;
        if (withSeconds) {
            const ss = String(d.getSeconds()).padStart(2, '0');
            timePart += `:${ss}`;
        }
        const full = `${datePart} ${timePart}`;
        return usePersianDigits ? toPersianDigits(full) : full;
    }

    /**
     * Parse Shamsi string (e.g. "1405/07/29 14:30" or "1405-07-29") into Gregorian Date
     */
    function parseJalaliString(str) {
        if (!str) return null;
        const latin = toLatinDigits(String(str)).trim();
        const m = /^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(latin);
        if (!m) return null;
        const jy = parseInt(m[1], 10);
        const jm = parseInt(m[2], 10);
        const jd = parseInt(m[3], 10);
        const hh = m[4] ? parseInt(m[4], 10) : 0;
        const min = m[5] ? parseInt(m[5], 10) : 0;
        const ss = m[6] ? parseInt(m[6], 10) : 0;

        if (jy >= 1300 && jy <= 1500 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
            const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
            return new Date(gy, gm - 1, gd, hh, min, ss);
        }
        return null;
    }

    // ── Interactive Persian Calendar Modal / Picker ─────────────────────────
    let _activePicker = null;

    function createPickerDOM() {
        if (document.getElementById('persianCalendarModal')) return;

        const modal = document.createElement('div');
        modal.id = 'persianCalendarModal';
        modal.className = 'pcal-modal-backdrop';
        modal.innerHTML = `
            <div class="pcal-dialog" role="dialog" aria-modal="true" aria-label="انتخاب تاریخ">
                <div class="pcal-header">
                    <button type="button" class="pcal-nav-btn" id="pcalNextMonth" title="ماه بعد"><i class="mdi mdi-chevron-right"></i></button>
                    <div class="pcal-title-wrap">
                        <select id="pcalMonthSelect" class="pcal-select"></select>
                        <select id="pcalYearSelect" class="pcal-select"></select>
                    </div>
                    <button type="button" class="pcal-nav-btn" id="pcalPrevMonth" title="ماه قبل"><i class="mdi mdi-chevron-left"></i></button>
                </div>
                <div class="pcal-weekdays">
                    <span>ش</span><span>ی</span><span>د</span><span>س</span><span>چ</span><span>پ</span><span class="pcal-friday">ج</span>
                </div>
                <div class="pcal-days" id="pcalDaysGrid"></div>
                
                <div class="pcal-time-wrap" id="pcalTimeSection" style="display:none;">
                    <div class="pcal-time-title">ساعت و دقیقه:</div>
                    <div class="pcal-time-inputs">
                        <input type="number" id="pcalMinute" min="0" max="59" step="1" class="pcal-time-input" placeholder="00">
                        <span class="pcal-colon">:</span>
                        <input type="number" id="pcalHour" min="0" max="23" step="1" class="pcal-time-input" placeholder="00">
                    </div>
                </div>

                <div class="pcal-footer">
                    <button type="button" class="pcal-btn pcal-btn-today" id="pcalTodayBtn">امروز</button>
                    <div style="flex:1;"></div>
                    <button type="button" class="pcal-btn pcal-btn-cancel" id="pcalCancelBtn">انصراف</button>
                    <button type="button" class="pcal-btn pcal-btn-confirm" id="pcalConfirmBtn">تأیید</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Populate months
        const monthSelect = document.getElementById('pcalMonthSelect');
        PERSIAN_MONTH_NAMES.forEach((name, i) => {
            const opt = document.createElement('option');
            opt.value = i + 1;
            opt.textContent = name;
            monthSelect.appendChild(opt);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closePicker();
        });

        document.getElementById('pcalCancelBtn').addEventListener('click', closePicker);
        document.getElementById('pcalPrevMonth').addEventListener('click', () => changeMonth(-1));
        document.getElementById('pcalNextMonth').addEventListener('click', () => changeMonth(1));
        document.getElementById('pcalMonthSelect').addEventListener('change', renderDays);
        document.getElementById('pcalYearSelect').addEventListener('change', renderDays);
        document.getElementById('pcalTodayBtn').addEventListener('click', selectToday);
        document.getElementById('pcalConfirmBtn').addEventListener('click', confirmSelection);
    }

    let _state = {
        targetInput: null,
        hasTime: false,
        viewYear: 1405,
        viewMonth: 7,
        selectedYear: 1405,
        selectedMonth: 7,
        selectedDay: 29,
        hour: 0,
        minute: 0
    };

    function openPicker(targetInput, { hasTime = false } = {}) {
        if (typeof targetInput === 'string') {
            targetInput = document.getElementById(targetInput);
        }
        if (!targetInput) return;

        createPickerDOM();
        _state.targetInput = targetInput;
        _state.hasTime = hasTime;

        // Parse current value or use now
        let initialDate = new Date();
        if (targetInput.dataset.iso) {
            const d = new Date(targetInput.dataset.iso);
            if (!isNaN(d.getTime())) initialDate = d;
        } else if (targetInput.value) {
            const parsedJ = parseJalaliString(targetInput.value);
            if (parsedJ) {
                initialDate = parsedJ;
            } else {
                const d = new Date(targetInput.value);
                if (!isNaN(d.getTime())) initialDate = d;
            }
        }

        const [jy, jm, jd] = gregorianToJalali(initialDate.getFullYear(), initialDate.getMonth() + 1, initialDate.getDate());
        _state.viewYear = jy;
        _state.viewMonth = jm;
        _state.selectedYear = jy;
        _state.selectedMonth = jm;
        _state.selectedDay = jd;
        _state.hour = initialDate.getHours();
        _state.minute = initialDate.getMinutes();

        // Populate Years (range: current - 15 to current + 5)
        const yearSelect = document.getElementById('pcalYearSelect');
        yearSelect.innerHTML = '';
        for (let y = jy - 15; y <= jy + 6; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = toPersianDigits(y);
            yearSelect.appendChild(opt);
        }

        // Show/hide time section
        const timeSec = document.getElementById('pcalTimeSection');
        if (timeSec) {
            timeSec.style.display = hasTime ? 'flex' : 'none';
            document.getElementById('pcalHour').value = String(_state.hour).padStart(2, '0');
            document.getElementById('pcalMinute').value = String(_state.minute).padStart(2, '0');
        }

        renderDays();

        const modal = document.getElementById('persianCalendarModal');
        modal.classList.add('active');
        _activePicker = true;
    }

    function closePicker() {
        const modal = document.getElementById('persianCalendarModal');
        if (modal) modal.classList.remove('active');
        _activePicker = false;
    }

    function changeMonth(delta) {
        let m = _state.viewMonth + delta;
        let y = _state.viewYear;
        if (m < 1) {
            m = 12;
            y--;
        } else if (m > 12) {
            m = 1;
            y++;
        }
        _state.viewMonth = m;
        _state.viewYear = y;
        renderDays();
    }

    function selectToday() {
        const now = new Date();
        const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        _state.viewYear = jy;
        _state.viewMonth = jm;
        _state.selectedYear = jy;
        _state.selectedMonth = jm;
        _state.selectedDay = jd;
        _state.hour = now.getHours();
        _state.minute = now.getMinutes();

        const timeSec = document.getElementById('pcalTimeSection');
        if (timeSec && _state.hasTime) {
            document.getElementById('pcalHour').value = String(_state.hour).padStart(2, '0');
            document.getElementById('pcalMinute').value = String(_state.minute).padStart(2, '0');
        }

        renderDays();
    }

    function renderDays() {
        const monthSelect = document.getElementById('pcalMonthSelect');
        const yearSelect = document.getElementById('pcalYearSelect');
        const daysGrid = document.getElementById('pcalDaysGrid');

        if (monthSelect) monthSelect.value = _state.viewMonth;
        if (yearSelect) yearSelect.value = _state.viewYear;
        if (!daysGrid) return;

        daysGrid.innerHTML = '';

        // Day of week for 1st of this Jalali month
        // In JS Date, getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
        // In Persian calendar: 0 is Saturday, 1 is Sunday, ..., 6 is Friday
        const [gy, gm, gd] = jalaliToGregorian(_state.viewYear, _state.viewMonth, 1);
        const firstDayDate = new Date(gy, gm - 1, gd);
        const jsDay = firstDayDate.getDay();
        const persianStartDay = (jsDay + 1) % 7; // Saturday -> 0, Sunday -> 1, ..., Friday -> 6

        // Empty cells before 1st of month
        for (let i = 0; i < persianStartDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'pcal-day-cell pcal-day-empty';
            daysGrid.appendChild(emptyCell);
        }

        const totalDays = getJalaliMonthDays(_state.viewYear, _state.viewMonth);
        const todayJ = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

        for (let d = 1; d <= totalDays; d++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pcal-day-cell pcal-day-btn';
            btn.textContent = toPersianDigits(d);

            const dayOfWeek = (persianStartDay + d - 1) % 7;
            if (dayOfWeek === 6) {
                btn.classList.add('pcal-day-friday'); // Friday
            }

            // Is today
            if (_state.viewYear === todayJ[0] && _state.viewMonth === todayJ[1] && d === todayJ[2]) {
                btn.classList.add('pcal-day-today');
            }

            // Is selected
            if (_state.viewYear === _state.selectedYear && _state.viewMonth === _state.selectedMonth && d === _state.selectedDay) {
                btn.classList.add('pcal-day-selected');
            }

            btn.addEventListener('click', () => {
                _state.selectedYear = _state.viewYear;
                _state.selectedMonth = _state.viewMonth;
                _state.selectedDay = d;
                renderDays();
            });

            daysGrid.appendChild(btn);
        }
    }

    function confirmSelection() {
        if (!_state.targetInput) return;

        let hh = _state.hour;
        let mm = _state.minute;
        if (_state.hasTime) {
            const hVal = parseInt(document.getElementById('pcalHour').value, 10);
            const mVal = parseInt(document.getElementById('pcalMinute').value, 10);
            hh = isNaN(hVal) ? 0 : Math.min(23, Math.max(0, hVal));
            mm = isNaN(mVal) ? 0 : Math.min(59, Math.max(0, mVal));
        }

        // Convert selected Jalali back to Gregorian Date
        const [gy, gm, gd] = jalaliToGregorian(_state.selectedYear, _state.selectedMonth, _state.selectedDay);
        const finalDate = new Date(gy, gm - 1, gd, hh, mm, 0);

        // Format to ISO
        const tzOffset = finalDate.getTimezoneOffset() * 60000;
        const localIso = new Date(finalDate.getTime() - tzOffset).toISOString().slice(0, _state.hasTime ? 16 : 10);

        _state.targetInput.dataset.iso = localIso;

        // Set displayed value in Shamsi format
        if (_state.hasTime) {
            _state.targetInput.value = formatJalaliDateTime(finalDate, { withSeconds: false, usePersianDigits: false });
        } else {
            _state.targetInput.value = formatJalaliDate(finalDate, { usePersianDigits: false });
        }

        // Sync companion picker if exists
        const companionPicker = document.getElementById(_state.targetInput.id + 'Picker');
        if (companionPicker) {
            companionPicker.value = localIso;
        }

        // Trigger change events
        _state.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        _state.targetInput.dispatchEvent(new Event('change', { bubbles: true }));

        closePicker();
    }

    return {
        PERSIAN_MONTH_NAMES,
        PERSIAN_WEEKDAYS_SHORT,
        PERSIAN_WEEKDAYS_FULL,
        toPersianDigits,
        toLatinDigits,
        gregorianToJalali,
        jalaliToGregorian,
        isJalaliLeap,
        getJalaliMonthDays,
        formatJalaliDate,
        formatJalaliDateTime,
        parseJalaliString,
        openPicker,
        closePicker
    };
}));

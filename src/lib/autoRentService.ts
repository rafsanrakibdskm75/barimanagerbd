import { supabase } from './supabase';

/**
 * Runs the automatic monthly rent and due generation logic.
 * Should be called once upon layout load/auth load.
 */
export async function runAutoMonthlyRentGeneration() {
  try {
    // 1. Fetch settings from app_settings
    let { data: settings, error: settingsErr } = await supabase
      .from('app_settings')
      .select('*')
      .maybeSingle();

    // If settings row does not exist, create a default one
    if (!settings && !settingsErr) {
      const defaultSettings = {
        app_name: 'Bari Manager BD',
        default_language: 'bn' as const,
        theme_mode: 'light' as const,
        date_format: 'DD/MM/YYYY',
        currency: 'BDT',
        house_name: 'My House',
        default_monthly_rent: 0,
        due_date: 5,
        late_fee_percentage: 0,
        auto_bill_generate: true,
        auto_carry_meter_reading: true,
        partial_payment_enabled: true,
        electricity_per_unit: 7,
        water_bill_amount: 0,
        service_charge_amount: 0,
        gas_bill_amount: 0,
        auto_meter_calculation: true,
        meter_warning_limit: 100,
        pending_rent_reminder: true,
        due_date_notification: true,
        overdue_alert: true,
        push_notification_enabled: true,
        sound_vibration_enabled: true,
        offline_mode_enabled: false,
        auto_sync_enabled: true,
        default_payment_method: 'cash',
        auto_generate_receipt: true,
        monthly_pdf_export: false,
        excel_export: false,
        auto_report_generate: false,
        theme_color: '#1976d2',
        card_style: 'elevated',
        font_size: 'normal' as const,
        compact_mode: false,
        animations_enabled: true,
        app_version: '1.0.0',
      } as any;

      const { data: inserted, error: insertErr } = await supabase
        .from('app_settings')
        .insert(defaultSettings)
        .single();

      if (insertErr) {
        console.error('Auto Rent Service: Failed to create default settings', insertErr);
        return;
      }
      settings = inserted;
    }

    if (settingsErr || !settings) {
      console.log('Auto Rent Service: Settings not found or error loading settings.');
      return;
    }

    // Check if auto rent generation is enabled
    if (!settings.auto_bill_generate) {
      console.log('Auto Rent Service: Auto rent generation is disabled in settings.');
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    console.log(`Auto Rent Service: Checking auto rent generation for ${currentMonth}/${currentYear}...`);

    // Compute previous month/year for due carry‑forward
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 2. Fetch all occupied flats
    const { data: flats, error: flatsErr } = await supabase
      .from('flats')
      .select('*')
      .eq('status', 'occupied');

    if (flatsErr || !flats || flats.length === 0) {
      console.log('Auto Rent Service: No occupied flats found.');
      return;
    }

    // 3. Process each occupied flat
    for (const flat of flats) {
      // ---- Existing collection for current month? ----
      const { data: existingCol, error: colCheckErr } = await supabase
        .from('rent_collections')
        .select('*')
        .eq('flat_id', flat.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();

      if (colCheckErr) {
        console.error(`Auto Rent Service: Error checking collection for flat ${flat.flat_number}:`, colCheckErr);
        continue;
      }

      // ---- Previous month unpaid due ----
      let previousDue = 0;
      const { data: prevCol, error: prevColErr } = await supabase
        .from('rent_collections')
        .select('total_payable, amount_paid')
        .eq('flat_id', flat.id)
        .eq('month', prevMonth)
        .eq('year', prevYear)
        .maybeSingle();

      if (!prevColErr && prevCol && prevCol.amount_paid < prevCol.total_payable) {
        previousDue = Number(prevCol.total_payable) - Number(prevCol.amount_paid);
      }

      // ---- Meter reading handling (same as before) ----
      let electricBill = 0;
      if (settings.auto_carry_meter_reading || settings.auto_meter_calculation) {
        const { data: existingMeter, error: meterCheckErr } = await supabase
          .from('meter_readings')
          .select('*')
          .eq('flat_id', flat.id)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .maybeSingle();

        if (!meterCheckErr && !existingMeter) {
          const { data: lastMeter } = await supabase
            .from('meter_readings')
            .select('*')
            .eq('flat_id', flat.id)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(1)
            .maybeSingle();

          const prevReading = lastMeter ? Number(lastMeter.current_reading) : 0;
          const perUnit = Number(settings.electricity_per_unit) || (lastMeter ? Number(lastMeter.per_unit_price) : 7);

          const { data: newMeter, error: insertMeterErr } = await supabase
            .from('meter_readings')
            .insert({
              flat_id: flat.id,
              month: currentMonth,
              year: currentYear,
              previous_reading: prevReading,
              current_reading: prevReading,
              per_unit_price: perUnit,
            })
            .select()
            .maybeSingle();

          if (insertMeterErr) {
            console.error(`Auto Rent Service: Error creating meter reading for flat ${flat.flat_number}:`, insertMeterErr);
          } else if (newMeter) {
            electricBill = Number(newMeter.total_bill) || 0;
          }
        } else if (existingMeter) {
          electricBill = Number(existingMeter.total_bill) || 0;
        }
      }

      // ---- Create collection if missing ----
      if (!existingCol) {
        const monthlyRent = Number(flat.monthly_rent) || 0;
        const waterBill = Number(flat.water_bill) || 0;
        const serviceCharge = Number(flat.service_charge) || 0;
        const totalPayable = monthlyRent + waterBill + serviceCharge + electricBill + previousDue;

        const { error: insertColErr } = await supabase
          .from('rent_collections')
          .insert({
            flat_id: flat.id,
            month: currentMonth,
            year: currentYear,
            monthly_rent: monthlyRent,
            electric_bill: electricBill,
            water_bill: waterBill,
            service_charge: serviceCharge,
            previous_due: previousDue,
            total_payable: totalPayable,
            amount_paid: 0,
            payment_status: previousDue > 0 ? 'partial' : 'pending',
            notes: 'Automatically generated by system',
          });

        if (insertColErr) {
          console.error(`Auto Rent Service: Error inserting collection for flat ${flat.flat_number}:`, insertColErr);
        } else {
          console.log(`Auto Rent Service: Generated rent collection for flat ${flat.flat_number}`);
        }
      }
    }
  } catch (err) {
    console.error('Auto Rent Service: Unhandled error during generation:', err);
  }
}

const { Client } = require('pg');
const connectionString = 'postgres://postgres.jjruquhoqcwcmogpfvhf:ProxiJob%4012346@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Database.');

    // 1. Find the user ID for business@proxijob.test
    const userRes = await client.query(`
      SELECT id, email FROM public.identity_users WHERE email = 'business@proxijob.test';
    `);

    if (userRes.rows.length === 0) {
      console.log('User business@proxijob.test not found.');
      return;
    }

    const userId = userRes.rows[0].id;
    console.log(`Found User business@proxijob.test with ID: ${userId}`);

    // 2. Find the Subscription ID for Enterprise
    const planRes = await client.query(`
      SELECT id, name FROM public.identity_subscriptions WHERE name = 'Enterprise';
    `);

    if (planRes.rows.length === 0) {
      console.log('Subscription "Enterprise" not found.');
      return;
    }

    const subscriptionId = planRes.rows[0].id;
    console.log(`Found Enterprise Subscription with ID: ${subscriptionId}`);

    // 3. Expire all current active subscriptions for this user
    const updateRes = await client.query(`
      UPDATE public.identity_usersubscriptions
      SET status = 'Expired', updatedat = NOW(), updatedby = 'System'
      WHERE userid = $1 AND status = 'Active';
    `, [userId]);
    console.log(`Expired ${updateRes.rowCount} active subscriptions for user.`);

    // 4. Insert new active Enterprise subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 365); // 1 year duration for testing

    const insertRes = await client.query(`
      INSERT INTO public.identity_usersubscriptions 
      (userid, subscriptionid, startdate, enddate, status, isdeleted, createdby, createdat)
      VALUES ($1, $2, $3, $4, 'Active', false, 'System', NOW())
      RETURNING id;
    `, [userId, subscriptionId, startDate, endDate]);

    console.log(`Successfully assigned Enterprise subscription to business@proxijob.test! New record ID: ${insertRes.rows[0].id}`);

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await client.end();
  }
}

main();

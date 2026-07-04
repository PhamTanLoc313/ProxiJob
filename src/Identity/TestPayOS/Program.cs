using System;
using Npgsql;

class Program
{
    static void Main()
    {
        var connString = "Host=aws-1-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.jjruquhoqcwcmogpfvhf;Password=ProxiJob@12346;Maximum Pool Size=4;";
        using var conn = new NpgsqlConnection(connString);
        conn.Open();
        
        using (var cmd = new NpgsqlCommand(@"
            SELECT u.id, u.email, u.fullname, r.name 
            FROM identity_users u
            LEFT JOIN identity_userroles ur ON u.id = ur.userid
            LEFT JOIN identity_roles r ON ur.roleid = r.id", conn))
        using (var reader = cmd.ExecuteReader())
        {
            Console.WriteLine("Users in DB:");
            while (reader.Read())
            {
                var id = reader.GetInt32(0);
                var email = reader.GetString(1);
                var name = reader.IsDBNull(2) ? "NULL" : reader.GetString(2);
                var role = reader.IsDBNull(3) ? "NULL" : reader.GetString(3);
                Console.WriteLine($"  Id: {id}, Email: {email}, Name: {name}, Role: {role}");
            }
        }
    }
}

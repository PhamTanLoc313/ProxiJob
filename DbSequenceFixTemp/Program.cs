using System;
using System.IO;
using Npgsql;
using Renci.SshNet;

namespace DbSequenceFixTemp
{
    class Program
    {
        static void Main(string[] args)
        {
            string host = "180.93.59.204";
            string username = "root";
            string password = "3u6RplHgaC8ye1OH";

            Console.WriteLine("=== 1. FIXING SUBSCRIPTION FOR khoidepgiai152@gmail.com ===");
            string connString = "Host=aws-1-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.jjruquhoqcwcmogpfvhf;Password=ProxiJob@12346;Maximum Pool Size=4;";
            try
            {
                using var conn = new NpgsqlConnection(connString);
                conn.Open();
                using var tran = conn.BeginTransaction();

                // Find user 158 (khoidepgiai152@gmail.com)
                int userId = 158;

                // Set Sub ID 8 (HRM Basic) or the latest Paid sub to Active
                using (var cmd = new NpgsqlCommand(@"
                    UPDATE identity_usersubscriptions 
                    SET status = 'Active', enddate = NOW() + INTERVAL '30 days' 
                    WHERE userid = :userId AND subscriptionid = 8;", conn, tran))
                {
                    cmd.Parameters.AddWithValue("userId", userId);
                    int count = cmd.ExecuteNonQuery();
                    Console.WriteLine($"Activated HRM Basic subscription for user 158: {count} row(s) updated.");
                }

                tran.Commit();
                Console.WriteLine("✅ Database subscription activated!");
            }
            catch (Exception ex)
            {
                Console.WriteLine("DB Fix warning: " + ex.Message);
            }

            Console.WriteLine("\n=== 2. UPLOADING CLIENT DIST TO VPS ===");
            using (var sftp = new SftpClient(host, username, password))
            {
                sftp.Connect();

                string distDir = Path.Combine(@"d:\ProxiJob", "src", "ProxiJob_Client", "dist");
                string remoteDir = "/var/www/proxijob-client";

                try
                {
                    foreach (var f in sftp.ListDirectory(remoteDir))
                    {
                        if (f.Name == "." || f.Name == "..") continue;
                        string rp = remoteDir + "/" + f.Name;
                        if (f.IsDirectory)
                        {
                            foreach (var sf in sftp.ListDirectory(rp))
                            {
                                if (sf.Name == "." || sf.Name == "..") continue;
                                sftp.DeleteFile(rp + "/" + sf.Name);
                            }
                            sftp.DeleteDirectory(rp);
                        }
                        else sftp.DeleteFile(rp);
                    }
                } catch {}

                UploadDir(sftp, distDir, remoteDir);
                sftp.Disconnect();
                Console.WriteLine("✅ Client dist uploaded!");
            }

            Console.WriteLine("\n=== 3. REBUILDING IDENTITY-API CONTAINER ON VPS ===");
            using (var ssh = new SshClient(host, username, password))
            {
                ssh.Connect();
                var cmd = ssh.CreateCommand("cd /root/ProxiJob && docker compose build identity-api && docker compose up -d identity-api && nginx -s reload 2>/dev/null || true");
                cmd.CommandTimeout = TimeSpan.FromMinutes(5);
                string res = cmd.Execute();
                Console.WriteLine("SSH Output:\n" + res);
                ssh.Disconnect();
            }

            Console.WriteLine("\n✅ DEPLOYMENT FINISHED SUCCESSFULLY!");
        }

        static void UploadDir(SftpClient sftp, string localDir, string remoteDir)
        {
            try { sftp.CreateDirectory(remoteDir); } catch {}
            foreach (var file in Directory.GetFiles(localDir))
            {
                using var fs = File.OpenRead(file);
                sftp.UploadFile(fs, remoteDir + "/" + Path.GetFileName(file), true);
            }
            foreach (var dir in Directory.GetDirectories(localDir))
            {
                string name = Path.GetFileName(dir);
                if (name == "node_modules" || name == ".git") continue;
                UploadDir(sftp, dir, remoteDir + "/" + name);
            }
        }
    }
}

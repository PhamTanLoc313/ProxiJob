using System;
using System.IO;
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

            Console.WriteLine("=== UPLOADING CLIENT DIST TO VPS ===");
            using (var sftp = new SftpClient(host, username, password))
            {
                sftp.Connect();
                Console.WriteLine("SFTP Connected.");

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

                // Upload Nginx config
                string localNginxConfig = @"d:\ProxiJob\deploy\nginx\api.proxijob.io.vn.conf";
                string remoteNginxConfig = "/etc/nginx/conf.d/api.proxijob.io.vn.conf";
                if (File.Exists(localNginxConfig))
                {
                    using var fs = File.OpenRead(localNginxConfig);
                    sftp.UploadFile(fs, remoteNginxConfig, true);
                    Console.WriteLine("✅ Uploaded api.proxijob.io.vn.conf to /etc/nginx/conf.d/");
                }

                sftp.Disconnect();
                Console.WriteLine("✅ Client dist uploaded!");
            }

            Console.WriteLine("\n=== REBUILDING BACKEND IDENTITY API & RELOADING NGINX ===");
            using (var ssh = new SshClient(host, username, password))
            {
                ssh.Connect();

                // Git pull & docker compose rebuild backend
                Console.WriteLine("Executing SSH Commands...");
                var cmd = ssh.CreateCommand("cd /var/www/proxijob && git pull && docker compose build identity-api && docker compose up -d identity-api && nginx -s reload 2>/dev/null || docker exec proxijob-nginx nginx -s reload 2>/dev/null || true");
                cmd.CommandTimeout = TimeSpan.FromMinutes(3);
                string result = cmd.Execute();
                Console.WriteLine(result);

                ssh.Disconnect();
            }

            Console.WriteLine("\n✅ DEPLOYMENT FINISHED!");
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

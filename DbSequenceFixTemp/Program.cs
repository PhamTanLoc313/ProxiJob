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
            string localFilePath = @"d:\ProxiJob\ProxiJob_Client.tar.gz";
            string remoteDirPath = "/root/ProxiJob";
            string remoteTarPath = "/root/ProxiJob/ProxiJob_Client.tar.gz";

            Console.WriteLine($"=== STEP 1: CONNECTING VIA SFTP TO {host} ===");
            using (var sftp = new SftpClient(host, username, password))
            {
                sftp.Connect();
                Console.WriteLine("SFTP Connected successfully.");

                if (!sftp.Exists(remoteDirPath))
                {
                    sftp.CreateDirectory(remoteDirPath);
                    Console.WriteLine($"Created remote directory {remoteDirPath}.");
                }

                Console.WriteLine($"Uploading {localFilePath} ({new FileInfo(localFilePath).Length / 1024 / 1024} MB) to {remoteTarPath}...");
                using (var fileStream = File.OpenRead(localFilePath))
                {
                    sftp.UploadFile(fileStream, remoteTarPath, (uploaded) =>
                    {
                        Console.Write($"\rUploaded {uploaded / 1024 / 1024} MB...");
                    });
                }
                Console.WriteLine("\nUpload complete!");
                sftp.Disconnect();
            }

            Console.WriteLine($"\n=== STEP 2: EXECUTING DEPLOYMENT SCRIPT ON VPS VIA SSH ===");
            using (var ssh = new SshClient(host, username, password))
            {
                ssh.Connect();
                Console.WriteLine("SSH Connected successfully.");

                string deployCmd = "cd /root/ProxiJob && tar -xzf ProxiJob_Client.tar.gz && chmod +x deploy/deploy_client.sh && ./deploy/deploy_client.sh";
                using (var cmd = ssh.CreateCommand(deployCmd))
                {
                    var asyncResult = cmd.BeginExecute();
                    using (var reader = new StreamReader(cmd.OutputStream))
                    {
                        while (!asyncResult.IsCompleted || !reader.EndOfStream)
                        {
                            string? line = reader.ReadLine();
                            if (line != null)
                            {
                                Console.WriteLine(line);
                            }
                        }
                    }
                    cmd.EndExecute(asyncResult);

                    if (cmd.ExitStatus != 0)
                    {
                        Console.WriteLine($"\nCommand failed with exit code: {cmd.ExitStatus}");
                        Console.WriteLine($"Error Output: {cmd.Error}");
                    }
                    else
                    {
                        Console.WriteLine($"\nDeployment Command completed successfully (Exit Code: 0).");
                    }
                }

                ssh.Disconnect();
            }
        }
    }
}

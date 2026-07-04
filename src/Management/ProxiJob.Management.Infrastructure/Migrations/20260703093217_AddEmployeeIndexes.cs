using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProxiJob.Management.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_management_employees_business_id",
                table: "management_employees",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_management_employees_user_id",
                table: "management_employees",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_management_employees_business_id",
                table: "management_employees");

            migrationBuilder.DropIndex(
                name: "IX_management_employees_user_id",
                table: "management_employees");
        }
    }
}

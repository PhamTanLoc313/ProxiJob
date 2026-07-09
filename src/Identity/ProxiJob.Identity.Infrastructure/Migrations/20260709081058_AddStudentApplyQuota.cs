using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProxiJob.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentApplyQuota : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "applieslimit",
                table: "identity_studentprofiles",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "appliesused",
                table: "identity_studentprofiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "applieslimit",
                table: "identity_studentprofiles");

            migrationBuilder.DropColumn(
                name: "appliesused",
                table: "identity_studentprofiles");
        }
    }
}

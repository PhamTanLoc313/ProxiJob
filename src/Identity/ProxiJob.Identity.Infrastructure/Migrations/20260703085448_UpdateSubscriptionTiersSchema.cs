using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProxiJob.Identity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSubscriptionTiersSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "maxactiveqrs",
                table: "identity_subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "maxemployees",
                table: "identity_subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "maxsearchradius",
                table: "identity_subscriptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "maxactiveqrs",
                table: "identity_subscriptions");

            migrationBuilder.DropColumn(
                name: "maxemployees",
                table: "identity_subscriptions");

            migrationBuilder.DropColumn(
                name: "maxsearchradius",
                table: "identity_subscriptions");
        }
    }
}
